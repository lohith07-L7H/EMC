
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://rgotvdeibaomemjgdvdx.supabase.co";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/extract-nptel-skills`;

const BATCH_SIZE = 50;
const TOTAL_COURSES = 3483;

let offset = 30;
let totalProcessed = 0;
let totalSkills = 0;
let totalSkipped = 0;

if (!SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from your .env file."
  );
  process.exit(1);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBatch(currentOffset) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          limit: BATCH_SIZE,
          offset: currentOffset,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `HTTP ${response.status}`
        );
      }

      return result;
    } catch (error) {
      console.log(
        `Attempt ${attempt}/3 failed: ${error.message}`
      );

      if (attempt === 3) throw error;

      await sleep(2000 * attempt);
    }
  }
}

async function main() {
  console.log("\n==================================");
  console.log(" EMC NPTEL SKILL EXTRACTION");
  console.log("==================================\n");

  console.log(`Starting from course ${offset + 1}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  while (offset < TOTAL_COURSES) {
    console.log(`Processing offset ${offset}...`);

    const result = await processBatch(offset);

    totalProcessed += result.processed;
    totalSkills += result.skills_saved;
    totalSkipped += result.skipped;

    offset = result.next_offset;

    const percentage = Math.min(
      (offset / TOTAL_COURSES) * 100,
      100
    ).toFixed(1);

    console.log(
      `Processed: ${totalProcessed} | ` +
      `Skills saved: ${totalSkills} | ` +
      `Skipped: ${totalSkipped}`
    );

    console.log(`Overall progress: ${percentage}%\n`);

    if (!result.has_more || result.processed === 0) {
      break;
    }

    await sleep(1000);
  }

  console.log("\n==================================");
  console.log(" EXTRACTION FINISHED");
  console.log("==================================");
  console.log(`Courses processed this run: ${totalProcessed}`);
  console.log(`Skill records upserted: ${totalSkills}`);
  console.log(`Courses without matches: ${totalSkipped}`);
  console.log(`Next offset: ${offset}`);
  console.log("==================================\n");
}

main().catch((error) => {
  console.error("\nEXTRACTION STOPPED:", error.message);
  console.log(`Resume from offset: ${offset}`);
  process.exit(1);
});
