
const endpoint =
  `${process.env.SUPABASE_URL}/functions/v1/sync-nptel-batch`;

const restEndpoint =
  `${process.env.SUPABASE_URL}/rest/v1/nptel_course_sync_status`;

const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_URL || !secret) {
  console.error("Missing Supabase URL or service role key.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
};

async function getCount(status) {
  const url =
    `${restEndpoint}?status=eq.${status}&select=course_id`;

  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      ...headers,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  if (!response.ok) {
    throw new Error(`Progress lookup failed: HTTP ${response.status}`);
  }

  const range = response.headers.get("content-range");
  const match = range?.match(/\/(\d+)$/);

  if (!match) {
    throw new Error("Could not read database progress.");
  }

  return Number(match[1]);
}

async function showProgress() {
  const [completed, pending, failed, processing] = await Promise.all([
    getCount("completed"),
    getCount("pending"),
    getCount("failed"),
    getCount("processing"),
  ]);

  const total = completed + pending + failed + processing;

  console.log("\n========== DATABASE PROGRESS ==========");
  console.log(`Completed:  ${completed} / ${total}`);
  console.log(`Pending:    ${pending}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Processing: ${processing}`);
  console.log("=======================================\n");

  return { completed, pending, failed, processing, total };
}

async function requestBatch(retryFailed) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 10,
          retry_failed: retryFailed,
        }),
        signal: AbortSignal.timeout(120000),
      });

      const text = await response.text();

      if (!text.trim()) {
        throw new Error(
          `Empty response from Supabase (HTTP ${response.status})`
        );
      }

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Supabase returned invalid JSON.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `HTTP ${response.status}`
        );
      }

      return result;
    } catch (error) {
      console.error(
        `Request attempt ${attempt}/4 failed: ${error.message}`
      );

      if (attempt === 4) throw error;

      await sleep(attempt * 5000);
      console.log("Retrying the same batch safely...");
    }
  }
}

async function runBatch(retryFailed) {
  let batchNumber = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  while (true) {
    batchNumber++;

    console.log(
      `\nSession batch ${batchNumber} | Retry failed: ${retryFailed}`
    );

    try {
      const result = await requestBatch(retryFailed);

      const selected = result.selected_courses ?? 0;
      const successful = result.successful ?? 0;
      const failed = result.failed ?? 0;

      totalSuccess += successful;
      totalFailed += failed;

      console.log(
        `Selected: ${selected} | Successful: ${successful} | Failed: ${failed}`
      );

      for (const course of result.results ?? []) {
        console.log(
          course.success
            ? `SUCCESS: ${course.course_id} - ${course.title} (${course.saved_lectures} lectures)`
            : `FAILED: ${course.course_id} - ${course.error}`
        );
      }

      await showProgress();

      if (selected === 0) break;

      await sleep(1000);
    } catch (error) {
      console.error("\nImport paused:", error.message);
      console.log("Your saved database records are preserved.");
      console.log("Run this script again when ready to resume.");

      return { stopped: true, totalSuccess, totalFailed };
    }
  }

  return { stopped: false, totalSuccess, totalFailed };
}

async function main() {
  console.log("Starting EMC NPTEL import/resume...");

  const initial = await showProgress();

  if (initial.pending > 0) {
    console.log(
      `Resuming from ${initial.completed} completed courses.`
    );

    const firstPass = await runBatch(false);

    if (firstPass.stopped) return;

    console.log("\nFirst pass finished. Retrying failed courses...");

    const retryPass1 = await runBatch(true);

    if (retryPass1.stopped) return;

    const retryPass2 = await runBatch(true);

    if (retryPass2.stopped) return;

    console.log("\n========== IMPORT SUMMARY ==========");
    console.log("First pass successes:", firstPass.totalSuccess);
    console.log("First pass failures:", firstPass.totalFailed);
    console.log("Retry 1 successes:", retryPass1.totalSuccess);
    console.log("Retry 2 successes:", retryPass2.totalSuccess);
  } else {
    console.log("No pending courses remain.");
  }

  await showProgress();

  console.log("\nImport process finished.");
}

main().catch(console.error);