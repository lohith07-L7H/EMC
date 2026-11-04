
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function getProfileValue(
  profile: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = profile[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value) && value.length > 0) {
      return value.map(String).join(", ");
    }
  }

  return "Not provided";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY is missing from Supabase Edge Function secrets.",
        },
        500,
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          error: "Supabase environment configuration is missing.",
        },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const profile = await req.json();

    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return jsonResponse({ error: "Invalid profile data." }, 400);
    }

    const userProfile = profile as Record<string, unknown>;

    const careerGoal = getProfileValue(userProfile, [
      "careerGoal",
      "career_goal",
    ]);

    const skillLevel = getProfileValue(userProfile, [
      "skillLevel",
      "skill_level",
    ]);

    const dailyLearningTime = getProfileValue(userProfile, [
      "dailyLearningTime",
      "daily_learning_time",
      "dailyTime",
    ]);

    const mainTarget = getProfileValue(userProfile, [
      "mainTarget",
      "main_target",
    ]);

    if (
      careerGoal === "Not provided" ||
      skillLevel === "Not provided" ||
      dailyLearningTime === "Not provided" ||
      mainTarget === "Not provided"
    ) {
      return jsonResponse(
        {
          error:
            "The profile must include career goal, skill level, daily learning time, and main target.",
        },
        400,
      );
    }

    const instructions = `
You are EMC, an expert career mentor and learning-roadmap architect.

Your task is to generate a personalized learning roadmap that can be displayed
as a CONNECTED VISUAL LEARNING PATH.

The roadmap is NOT a generic syllabus, essay, or list of unrelated courses.

========================
1. PERSONALIZE THE ROADMAP
========================

Use the learner's actual profile:

- Career goal: ${careerGoal}
- Current skill level: ${skillLevel}
- Available daily learning time: ${dailyLearningTime}
- Main target: ${mainTarget}
- Existing skills: ${getProfileValue(userProfile, [
      "existingSkills",
      "existing_skills",
      "skills",
    ])}
- Completed projects: ${getProfileValue(userProfile, [
      "completedProjects",
      "completed_projects",
      "projects",
    ])}
- Education level: ${getProfileValue(userProfile, [
      "educationLevel",
      "education_level",
      "education",
    ])}

The profile object supplied by the user contains the authoritative information.
Do not invent skills, qualifications, or completed projects.

KNOWN-SKILL SKIP RULE (IMPORTANT):

- Treat the learner's listed existing skills as skills they already know.
- SKIP those skills completely: do not add them as roadmap topics, revision
  topics, beginner introductions, or standalone stages.
- Do not add a short review for a skill that appears in the existing-skills list.
- Recognize common equivalent names and closely matching terms (for example,
  "JS" means JavaScript and "HTML5" means HTML). Avoid reintroducing the same
  skill under a slightly different label.
- If the learner knows only part of a broader area, skip only the specifically
  listed skills and include the genuinely missing skills.
- Use completed projects as supporting context, but do not assume they prove
  mastery of every technology that might have been used in them.
- Start the roadmap at the earliest important skill the learner has not listed
  as known, while preserving all prerequisites that are still missing.
- Do not remove a prerequisite just because a later skill is listed. If the
  learner lists an advanced skill but not a prerequisite, include only the
  missing prerequisite when it is genuinely necessary.
- Checkpoints must not require the learner to demonstrate a skill that was
  skipped unless it is needed as an integration skill for the new work.

The learner's existing-skills list is:
${getProfileValue(userProfile, [
      "existingSkills",
      "existing_skills",
      "skills",
    ])}

Do not generate a Web Developer roadmap unless that matches the learner's
actual career goal.

========================
2. BUILD A CONNECTED PATH
========================

Arrange stages and topics in a meaningful prerequisite order.

For example, a web development path could follow:

HTML
  -> CSS
  -> JavaScript
  -> DOM and browser APIs
  -> React
  -> APIs and backend
  -> Databases
  -> Deployment
  -> Portfolio and career preparation

This is only an example. Adapt the actual roadmap to the learner's goal.

Each stage must contain topics that build on one another.

Every topic must be a short, specific skill suitable for an individual
visual node.

GOOD TOPIC LABELS:
- HTML Document Structure
- CSS Selectors and Box Model
- Flexbox and CSS Grid
- JavaScript Functions
- DOM Events
- React Components
- REST API Basics
- SQL Queries
- Git Branching

AVOID:
- Learn everything about programming
- Become an expert
- Complete the entire frontend
- Long explanations inside topic labels
- Combining unrelated skills in one topic

Use a natural sequence. Do not shuffle technologies or introduce advanced
tools before their prerequisites.

========================
3. DESIGN STAGES
========================

Create approximately 4–6 stages when appropriate, but adapt the number to
the actual career goal and the learner's existing skills.

Possible web development stages include:

- Web Foundations
- Frontend Development
- Backend Development
- Databases and API Integration
- DevOps and Deployment
- Projects and Career Preparation

These are examples, not mandatory stage names.

Do not force every career into these categories.

Give every stage:

- A short, meaningful title.
- A concise description explaining its purpose.
- A realistic timeline based on the learner's available time.
- A sequence of individual learning topics.
- One practical checkpoint that tests the stage's skills.

Usually include 3–6 topics per stage. Use fewer when the learner already
knows the material or when the career requires a different structure.

Avoid giving every career the same topics, stage count, or timeline.

========================
4. CHECKPOINT PROJECTS
========================

Every stage must have a practical checkpoint.

A checkpoint should describe a specific deliverable, not merely say
"finish learning this stage."

Examples:

- Build a responsive personal portfolio website.
- Create an interactive to-do application using browser storage.
- Build a React application that consumes a public API.
- Create a REST API with validation and error handling.
- Build a database-backed application with CRUD operations.
- Deploy a full-stack project and document its setup.

These examples must only be used when appropriate for the chosen career.

A checkpoint must use skills already introduced in its stage or earlier stages.
Do not require technologies that have not been taught yet.

Use a clear, achievable project that proves the learner can apply the skills.

========================
5. OPTIONAL TOPICS AND BRANCHES
========================

Where useful, include optional topics that expand the main path.

Mark an optional topic by prefixing its label with "[Optional]".

Examples for an appropriate web development path:

- [Optional] TypeScript
- [Optional] Next.js
- [Optional] Advanced Animation
- [Optional] Monitoring and Logging

Only add optional topics that are relevant to the career goal.

Do not make essential prerequisites optional.

The current frontend displays topics as a sequential path. Therefore, place
optional topics after their prerequisites and keep their labels concise.
Do not pretend that this response format can encode actual branching
connections; it only supports ordered topic strings at present.

========================
6. CAREER READINESS
========================

Make the final stage support the learner's actual main target.

For internship or job targets, include relevant items such as:

- Strong portfolio projects
- Git and GitHub
- Resume preparation
- Interview practice
- Targeted applications

Do not include every item automatically if it is not relevant.

For other targets, focus the final stage on the appropriate outcome.

========================
7. TIMELINE AND LEARNING LOAD
========================

Use the daily time supplied in the profile.

Keep the workload realistic for a beginner with limited study time.

Do not promise a job or internship by a specific date.

Do not claim that completing a roadmap guarantees employment.

Prefer steady progress and practical projects over excessive topic counts.

========================
8. OUTPUT FORMAT
========================

Return ONLY valid JSON.

Use exactly this structure:

{
  "roadmap": [
    {
      "title": "Web Foundations",
      "description": "Build the core skills needed for the next stage.",
      "timeline": "2–3 weeks",
      "tasks": [
        "HTML Document Structure",
        "CSS Selectors and Box Model",
        "Flexbox and CSS Grid",
        "[Optional] Advanced CSS Animations"
      ],
      "checkpoint": "Build a responsive portfolio page using HTML and CSS."
    }
  ]
}

The example above only demonstrates the schema. Do not copy it blindly.

STRICT REQUIREMENTS:

- The top-level response must contain a "roadmap" array.
- Each stage must contain "title", "description", "timeline", "tasks",
  and "checkpoint".
- "title", "description", "timeline", and "checkpoint" must be strings.
- "tasks" must be an array of short strings.
- Every stage must have at least one topic.
- Produce a sensible number of stages and topics for the profile.
- Do not include Markdown fences, comments, or introductory text.
- Do not add extra properties or nested objects.
- Never return an empty roadmap.
- Ensure the JSON is valid and all strings are properly escaped.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instructions }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Generate the personalized EMC roadmap using this complete saved profile. Follow the requested JSON schema exactly:\n" +
                    JSON.stringify(userProfile),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);

      return jsonResponse(
        {
          error:
            `Gemini API error (${response.status}): ` +
            (result?.error?.message || "The AI provider request failed."),
        },
        502,
      );
    }

    const content = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error(
        "Gemini returned no roadmap content. Please try generating again.",
      );
    }

    let parsed: { roadmap?: unknown };

    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Gemini returned invalid JSON:", content);

      throw new Error(
        "Gemini returned an invalid roadmap response. Please try again.",
      );
    }

    if (!Array.isArray(parsed.roadmap) || parsed.roadmap.length === 0) {
      throw new Error(
        "Gemini returned an empty or invalid roadmap structure.",
      );
    }

    const roadmap = parsed.roadmap
      .slice(0, 7)
      .map((stage: unknown, index: number) => {
        if (!stage || typeof stage !== "object") {
          return null;
        }

        const item = stage as Record<string, unknown>;

        const tasks = Array.isArray(item.tasks)
          ? item.tasks
              .filter(
                (task): task is string =>
                  typeof task === "string" && task.trim().length > 0,
              )
              .map((task) => task.trim())
              .slice(0, 8)
          : [];

        if (tasks.length === 0) {
          return null;
        }

        return {
          title:
            typeof item.title === "string" && item.title.trim()
              ? item.title.trim()
              : `Stage ${index + 1}`,

          description:
            typeof item.description === "string" && item.description.trim()
              ? item.description.trim()
              : "Build the skills required for your career goal.",

          timeline:
            typeof item.timeline === "string" && item.timeline.trim()
              ? item.timeline.trim()
              : "Flexible pace",

          tasks,

          checkpoint:
            typeof item.checkpoint === "string" && item.checkpoint.trim()
              ? item.checkpoint.trim()
              : "Complete a practical project demonstrating these skills.",
        };
      })
      .filter((stage): stage is NonNullable<typeof stage> => stage !== null);

    if (roadmap.length === 0) {
      throw new Error(
        "Gemini did not return any stages with valid learning topics.",
      );
    }

    // Fetch NPTEL recommendations for the selected career.
    // The roadmap is still returned even if the NPTEL lookup fails.
    
// Fetch and rank NPTEL recommendations for the selected career.
let nptelRecommendations: Record<string, unknown[]> = {};

try {
  const { data: matches, error: matchError } = await supabase
    .from("career_nptel_matches")
    .select(`
      skill_name,
      importance,
      nptel_course_uuid,
      nptel_course_id,
      course_title,
      instructor,
      institute,
      course_url,
      confidence,
      match_method,
      evidence,
      lecture_count
    `)
    .eq("career_name", careerGoal);

  if (matchError) {
    console.error("NPTEL recommendation lookup failed:", matchError);
  } else {
    const normalizeText = (value: unknown): string =>
      String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    // Alternative terminology used by NPTEL courses.
    const skillAliases: Record<string, string[]> = {
      "Python": [
        "python",
        "python programming",
        "programming using python",
      ],
      "Machine Learning": [
        "machine learning",
        "statistical learning",
      ],
      "Deep Learning": [
        "deep learning",
        "neural network",
        "convolutional neural network",
        "recurrent neural network",
        "cnn",
      ],
      "Artificial Intelligence": [
        "artificial intelligence",
        "intelligent systems",
        "ai",
      ],
      "Data Science": [
        "data science",
        "data analytics",
        "data analysis",
      ],
      "Algorithms": [
        "algorithms",
        "algorithm design",
        "design and analysis of algorithms",
        "data structures",
      ],
      "Statistics": [
        "statistics",
        "statistical methods",
        "applied statistics",
        "probability and statistics",
      ],
      "Mathematics": [
        "mathematics",
        "mathematical methods",
        "linear algebra",
        "calculus",
      ],
    };

    const isAiMlCareer = careerGoal
      .toLowerCase()
      .includes("machine learning");

    // These terms indicate domain-specific courses.
    const specializedDomainPattern =
      /\b(economics?|biolog(?:y|ical|ist|ists)|biomedical|drug discovery|petroleum|chemistry|chemical|seismolog(?:y|ical)?|bioinformatics?|experimentalists?|sequencing|genomics|biotechnology|agricultural?)\b/i;

    const rankedMatches = [...(matches ?? [])]
      .map((match) => {
        const title = normalizeText(match.course_title);
        const evidence = normalizeText(match.evidence);
        const combinedText = `${title} ${evidence}`;

        const aliases =
          skillAliases[match.skill_name] ?? [match.skill_name];

        const titleMatch = aliases.some((alias) =>
          ` ${title} `.includes(` ${normalizeText(alias)} `)
        );

        const lectureMatch = aliases.some((alias) =>
          ` ${evidence} `.includes(` ${normalizeText(alias)} `)
        );

        const isSpecialized =
          isAiMlCareer && specializedDomainPattern.test(combinedText);

        let score = Number(match.confidence ?? 0) * 10;

        // Direct course-title matches get the highest priority.
        if (titleMatch) score += 40;

        // Lecture evidence provides additional supporting relevance.
        else if (lectureMatch) score += 15;

        // Prefer courses that introduce or teach foundational concepts.
        if (/\b(introduction|foundation|fundamentals|basics|programming)\b/.test(title)) {
          score += 5;
        }

        if (match.match_method === "course_title_keyword") {
          score += 3;
        } else if (match.match_method === "lecture_title_keyword") {
          score += 1;
        }

        // Reduce priority for unrelated industry-specific courses.
        if (isSpecialized) {
          score -= 30;
        }

        const relevanceLevel = isSpecialized
          ? "specialized"
          : score >= 45
            ? "core"
            : "related";

        return {
          ...match,
          relevance_score: Math.round(score * 10) / 10,
          relevance_level: relevanceLevel,
        };
      })
      .sort((a, b) => {
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }

        return Number(b.lecture_count ?? 0) -
          Number(a.lecture_count ?? 0);
      });

    // Return up to three distinct courses per skill.
    for (const match of rankedMatches) {
      const skill = match.skill_name;

      if (!nptelRecommendations[skill]) {
        nptelRecommendations[skill] = [];
      }

      const courses = nptelRecommendations[skill] as any[];

      if (
        courses.length < 3 &&
        !courses.some(
          (course) =>
            course.nptel_course_uuid === match.nptel_course_uuid
        )
      ) {
        courses.push(match);
      }
    }
  }
} catch (error) {
  console.error("NPTEL lookup error:", error);
}

    return jsonResponse({
      roadmap,
      nptelRecommendations,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    console.error("generate-roadmap error:", message);

    return jsonResponse({ error: message }, 500);
  }
});
