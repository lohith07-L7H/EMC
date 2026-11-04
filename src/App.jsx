import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import ConceptAssignments from "./ConceptAssignments";
import PracticeWorkspace from "./PracticeWorkspace";
const CAREER_OPTIONS = [
  "AI / Machine Learning Engineer", "Data Scientist", "Data Analyst", "Data Engineer", "Software Engineer",
  "Web Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer",
  "Cybersecurity Analyst", "Ethical Hacker", "Cloud Engineer", "DevOps Engineer", "UI / UX Designer",
  "Game Developer", "Blockchain Developer", "QA / Test Engineer", "Embedded Systems Engineer", "Robotics Engineer",
  "Product Manager", "Business Analyst", "Digital Marketer", "Graphic Designer", "Technical Writer",
  "Database Administrator", "Network Engineer", "Computer Vision Engineer", "NLP Engineer", "Research Scientist", "Other",
];

const SKILLS_BY_CAREER = {
  "AI / Machine Learning Engineer": ["Python", "Statistics", "Linear Algebra", "Machine Learning", "Deep Learning", "SQL", "Data Cleaning", "TensorFlow / PyTorch", "Git", "Problem Solving"],
  "Data Scientist": ["Python", "Statistics", "Probability", "SQL", "Data Visualization", "Machine Learning", "Pandas", "Excel", "Power BI", "Communication"],
  "Data Analyst": ["Excel", "SQL", "Python", "Power BI", "Tableau", "Statistics", "Data Cleaning", "Data Visualization", "Communication"],
  "Data Engineer": ["Python", "SQL", "Databases", "ETL", "Data Warehousing", "Cloud Basics", "Linux", "Git", "Spark", "Problem Solving"],
  "Software Engineer": ["C", "C++", "Java", "Python", "Data Structures", "Algorithms", "OOP", "Git", "SQL", "Problem Solving"],
  "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Git", "REST APIs", "SQL", "Responsive Design"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Accessibility", "Responsive Design", "Git", "UI Testing"],
  "Backend Developer": ["JavaScript", "Node.js", "Python", "Java", "REST APIs", "SQL", "Authentication", "Git", "Docker"],
  "Full Stack Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "SQL", "REST APIs", "Git", "Authentication"],
  "Mobile App Developer": ["Java", "Kotlin", "Dart", "Flutter", "React Native", "APIs", "UI Design", "Git"],
  "Cybersecurity Analyst": ["Networking", "Linux", "Python", "Security Basics", "SIEM", "Web Security", "Incident Response", "Risk Assessment"],
  "Ethical Hacker": ["Networking", "Linux", "Python", "Web Security", "Penetration Testing", "OWASP", "Scripting", "Security Ethics"],
  "Cloud Engineer": ["Linux", "Networking", "AWS / Azure / GCP", "Docker", "Python", "Security Basics", "Git", "Infrastructure as Code"],
  "DevOps Engineer": ["Linux", "Git", "Docker", "CI/CD", "Cloud Basics", "Kubernetes", "Python / Bash", "Monitoring"],
  "UI / UX Designer": ["Figma", "Wireframing", "Prototyping", "User Research", "Visual Design", "Accessibility", "Design Systems"],
  "Game Developer": ["C#", "C++", "Unity", "Unreal Engine", "3D Basics", "Game Physics", "Git", "Problem Solving"],
  "Blockchain Developer": ["JavaScript", "Solidity", "Smart Contracts", "Cryptography Basics", "Web3", "Git", "Security Testing"],
  "QA / Test Engineer": ["Manual Testing", "Test Cases", "Automation Testing", "Selenium", "API Testing", "SQL", "Bug Reporting", "Python / Java"],
  "Embedded Systems Engineer": ["C", "C++", "Microcontrollers", "Digital Electronics", "RTOS Basics", "Embedded C", "Communication Protocols"],
  "Robotics Engineer": ["Python", "C++", "ROS", "Control Systems", "Sensors", "Linear Algebra", "Computer Vision", "Electronics"],
  "Product Manager": ["Communication", "User Research", "Product Strategy", "Analytics", "Roadmapping", "Prioritization", "Agile"],
  "Business Analyst": ["Excel", "SQL", "Power BI", "Requirements Gathering", "Process Mapping", "Communication", "Documentation"],
  "Digital Marketer": ["SEO", "Content Marketing", "Social Media", "Analytics", "Copywriting", "Email Marketing", "Ads Basics"],
  "Graphic Designer": ["Typography", "Color Theory", "Photoshop", "Illustrator", "Figma", "Layout", "Branding"],
  "Technical Writer": ["Writing", "Documentation", "Markdown", "Research", "API Documentation", "Editing", "Communication"],
  "Database Administrator": ["SQL", "Database Design", "Backup and Recovery", "Performance Tuning", "Security", "Linux", "Cloud Databases"],
  "Network Engineer": ["Networking Basics", "TCP/IP", "Routing", "Switching", "Linux", "Network Security", "Troubleshooting"],
  "Computer Vision Engineer": ["Python", "OpenCV", "Linear Algebra", "Deep Learning", "Image Processing", "PyTorch", "Statistics"],
  "NLP Engineer": ["Python", "Linguistics Basics", "Machine Learning", "Deep Learning", "Transformers", "Statistics", "PyTorch"],
  "Research Scientist": ["Mathematics", "Statistics", "Python", "Research Methods", "Scientific Writing", "Data Analysis", "Critical Thinking"],
  Other: ["Communication", "Problem Solving", "Research", "Computer Basics", "Python", "Excel", "Project Planning"],
};

const EDUCATION_OPTIONS = ["School", "Diploma", "B.Tech / B.E.", "Other degree", "Other"];
const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const TIME_OPTIONS = ["15–30 minutes", "30–60 minutes", "1–2 hours", "2–3 hours", "More than 3 hours"];
const TARGET_OPTIONS = ["Internship", "Job", "Portfolio", "Placements", "Learn a new skill", "Career switch", "Explore"];
const STEPS = ["Personal details", "Career goal", "Existing skills", "Skill level", "Projects", "Learning time", "Main target"];


function AskEmcPanel({ topic, lessonTitle, lessonDescription = "" }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: `Hi! I'm Ask EMC. Ask me anything about ${topic}, and I'll explain it step by step.` }]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages([{ role: "assistant", text: `Hi! I'm Ask EMC. Ask me anything about ${topic}, and I'll explain it step by step.` }]);
    setQuestion(""); setError(""); setBusy(false);
  }, [topic, lessonTitle]);

  const ask = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next); setQuestion(""); setBusy(true); setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("ask-emc", {
        body: { topic, lessonTitle, lessonDescription, question: text, history: next.slice(-9, -1).map(({ role, text: content }) => ({ role, content })) }
      });
      if (invokeError) throw new Error(invokeError.message || "Ask EMC couldn't respond.");
      if (data?.error) throw new Error(data.error);
      setMessages(current => [...current, { role: "assistant", text: data?.answer || "I couldn't generate an answer. Please try again." }]);
    } catch (err) { setError(err.message || "Ask EMC is temporarily unavailable."); }
    finally { setBusy(false); }
  };

  return <aside className="emc-ask-panel">
    <div className="emc-ask-heading"><span className="emc-ask-avatar">✦</span><div><strong>Ask EMC AI</strong><small>Your learning doubt solver</small></div><span className="emc-ask-online">ONLINE</span></div>
    <div className="emc-ask-context">Learning: <strong>{topic}</strong>{lessonTitle ? ` · ${lessonTitle}` : ""}</div>
    <div className="emc-ask-messages" aria-live="polite">
      {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`emc-ask-message ${message.role}`}>{message.text}</div>)}
      {busy && <div className="emc-ask-message assistant emc-ask-thinking">Thinking through your doubt…</div>}
    </div>
    {error && <p className="emc-ask-error">{error} Check that the ask-emc function is deployed and GEMINI_API_KEY is configured.</p>}
    <div className="emc-ask-prompts">
      {["Explain this simply", "Give me an example", "Quiz me on this"].map(prompt => <button type="button" key={prompt} disabled={busy} onClick={() => setQuestion(prompt)}>{prompt}</button>)}
    </div>
    <form className="emc-ask-form" onSubmit={ask}>
      <textarea value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask your doubt here…" rows={2} maxLength={1200} disabled={busy} aria-label="Ask your learning doubt" />
      <button type="submit" disabled={busy || !question.trim()} aria-label="Send question">{busy ? "…" : "➤"}</button>
    </form>
    <small className="emc-ask-note">AI can make mistakes. Verify important concepts with your course material.</small>
  </aside>;
}

const NPTEL_TOPIC_HINTS = {
  c: "programming c problem solving algorithms",
  "c programming": "programming c problem solving algorithms",
  "data structures": "data structures algorithms programming",
  dsa: "data structures algorithms",
  dbms: "database databases sql",
  database: "database databases sql",
  sql: "database databases sql",
  os: "operating system systems",
  "operating system": "operating system systems",
  cn: "computer networks networking",
  networks: "computer networks networking",
  "computer networks": "computer networks networking",
  ai: "artificial intelligence machine learning",
  "artificial intelligence": "artificial intelligence machine learning",
  ml: "machine learning",
  "machine learning": "machine learning",
  python: "programming python data structures",
  algorithms: "algorithms data structures",
  compiler: "compiler design theory computation",
  automata: "theory computation automata languages",
  "digital logic": "digital systems switching circuits",
};

function NptelCourseBrowser({
  topic,
  selectedCourse,
  setSelectedCourse,
  onExploreYoutube
}) {
  const [courses, setCourses] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNptelCourses() {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const pageSize = 1000;
        let allCourses = [];

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("nptel_courses")
            .select("course_id, title, instructor, institute, discipline, course_url, duration_weeks")
            .eq("is_active", true)
            .order("course_id", { ascending: true })
            .range(offset, offset + pageSize - 1);

          if (error) throw error;

          const page = data || [];
          allCourses = allCourses.concat(page.map(course => ({
            id: course.course_id,
            title: course.title || "Untitled NPTEL Course",
            instructor: course.instructor || "Not specified",
            institute: course.institute || "Not specified",
            discipline: course.discipline || "",
            duration: course.duration_weeks,
            url: course.course_url || `https://nptel.ac.in/courses/${course.course_id}`
          })));

          if (page.length < pageSize) break;
        }

        if (!cancelled) setCourses(allCourses);
      } catch (error) {
        console.error("NPTEL catalogue error:", error);
        if (!cancelled) setCatalogError(error.message || "Unable to check NPTEL courses right now.");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadNptelCourses();
    return () => { cancelled = true; };
  }, []);

  // Match courses by the actual subject, not generic words such as "programming"
  // or "control". Strip roadmap labels like [Optional] before matching.
  const normalizeTopic = value => String(value || "")
    .replace(/\[(?:optional|required)\]/gi, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const topicKey = normalizeTopic(topic);
  const topicAliases = {
    "python programming basics": ["python"],
    "python programming fundamentals": ["python"],
    "python programming": ["python"],
    "python syntax and control structures": ["python"],
    "linear algebra basics": ["linear algebra"],
    "calculus and differential equations": ["calculus", "differential equations"],
    "object-oriented programming in python": ["python"],
    "c++ programming basics": ["c++"],
    "c programming basics": ["c"],
    "data structures": ["data structures"],
    "algorithms": ["algorithms"],
    "robotics": ["robotics"],
    "robot operating system (ros 2)": ["robot operating system", "ros"],
    "ros 2 architecture and concepts": ["robot operating system", "ros"],
    "forward kinematics": ["kinematics", "robotics"],
    "inverse kinematics": ["kinematics", "robotics"],
    "spatial transformations and rotation matrices": ["linear algebra", "robotics"],
    "pid controllers": ["control systems", "control engineering"],
    "slam (simultaneous localization and mapping)": ["slam", "robotics"],
    "computer networks": ["computer networks"],
    "database management systems": ["database management", "dbms"]
  };
  const aliases = topicAliases[topicKey];

  const relevantCourses = courses.filter(course => {
    const title = String(course.title || "").toLowerCase().replace(/^noc:\s*/i, "");
    const discipline = String(course.discipline || "").toLowerCase();

    // Language-specific topics must match the language itself in the course title.
    // Do not let generic "programming", "control", or discipline labels qualify.
    if (topicKey.includes("c++")) {
      return /\bc\s*\+\s*\+\b|\bcpp\b|\bc\+\+/.test(title);
    }
    if (topicKey.includes("python")) {
      return /\bpython\b/.test(title);
    }
    if (topicKey.includes("c programming")) {
      return /\bprogramming\s+in\s+c\b|\bprogramming\s+through\s+c\b|\bc\s+programming\b|\bc programming\b/.test(title)
        && !/\+\+/.test(title);
    }

    const searchable = `${title} ${discipline}`;
    if (aliases?.length) {
      return aliases.some(term => searchable.includes(term));
    }

    // For other topics, require all meaningful topic words rather than any one
    // broad word. This prevents false matches from words like "control".
    const ignored = new Set(["basics", "basic", "fundamentals", "introduction", "using", "with", "and", "the", "optional", "required"]);
    const terms = topicKey.split(/[^a-z0-9]+/).filter(term => term.length > 3 && !ignored.has(term));
    return terms.length > 0 && terms.every(term => searchable.includes(term));
  });

  return (
    <div className="emc-nptel-browser">
      {catalogLoading && <div className="emc-resource-state"><span className="roadmap-spinner"/><strong>Checking NPTEL for a course on {topic}…</strong></div>}
      {!catalogLoading && catalogError && (
        <div className="emc-resource-state is-error" role="alert">
          <strong>We couldn't check NPTEL right now.</strong>
          <small>{catalogError}</small>
          <button type="button" className="btn btn-gold" onClick={onExploreYoutube}>Explore YouTube learning videos</button>
        </div>
      )}
      {!catalogLoading && !catalogError && relevantCourses.length === 0 && (
        <div className="emc-resource-state emc-nptel-unavailable">
          <strong>No matching NPTEL course is currently available for this topic.</strong>
          <p>Sorry, we couldn't find an NPTEL course that clearly covers <b>{topic}</b>. We don't want to recommend unrelated courses just to fill this space.</p>
          <p>Would you like to explore carefully selected YouTube lessons instead? You can find beginner-friendly explanations, complete courses and practical examples there.</p>
          <button type="button" className="btn btn-gold" onClick={onExploreYoutube}>Explore YouTube videos</button>
        </div>
      )}
      {!catalogLoading && !catalogError && relevantCourses.length > 0 && (
        <>
          <div className="emc-nptel-notice">
            <strong>{relevantCourses.length} NPTEL {relevantCourses.length === 1 ? "course" : "courses"} found for {topic}</strong>
            <span>These courses match the topic title or its subject area.</span>
          </div>
          <div className="emc-nptel-course-grid">
            {relevantCourses.slice(0, 24).map(course => (
              <button type="button" key={course.id} className={`emc-nptel-course ${selectedCourse?.id === course.id ? "active" : ""}`} onClick={() => setSelectedCourse(course)}>
                <span className="emc-nptel-course-type">NPTEL COURSE</span>
                <strong>{course.title.replace(/^NOC:\s*/i, "")}</strong>
                <small>{course.institute} · {course.id}</small>
              </button>
            ))}
          </div>
          {selectedCourse && (
            <section className="emc-nptel-selected" aria-label="NPTEL course learning workspace">
              <div className="emc-nptel-course-heading">
                <span className="emc-nptel-course-type">COURSE LEARNING WORKSPACE</span>
                <h4>{selectedCourse.title.replace(/^NOC:\\s*/i, "")}</h4>
                <p>{selectedCourse.institute} · Course ID {selectedCourse.id}</p>
                <p>Instructor: {selectedCourse.instructor}</p>
                {selectedCourse.duration && <p>Duration: {selectedCourse.duration} weeks</p>}
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap",margin:"18px 0 10px"}}>
                <strong>Course content</strong>
                <a className="btn btn-gold emc-nptel-open" href={selectedCourse.url} target="_blank" rel="noopener noreferrer">
                  Open NPTEL in new tab ↗
                </a>
              </div>

              <p className="emc-nptel-course-note">
                The official NPTEL course page is shown below. Use its syllabus and weekly lecture sections to choose lessons.
                If the page does not load inside EMC, use “Open NPTEL in new tab”.
              </p>

              <div style={{width:"100%",height:"min(78vh,900px)",minHeight:"620px",overflow:"hidden",border:"1px solid rgba(212,175,55,.25)",borderRadius:"14px",background:"#fff"}}>
                <iframe
                  key={selectedCourse.id}
                  title={`NPTEL course: ${selectedCourse.title}`}
                  src={selectedCourse.url}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{width:"100%",height:"100%",border:0,background:"#fff"}}
                  allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="emc-nptel-course-note" style={{marginTop:"10px"}}>
                Note: NPTEL controls whether its page can be embedded. Some courses may block the in-app view; EMC cannot override that restriction.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}


// Always provide useful checkpoint ideas, even when the roadmap API omits stage.projects.
function getCheckpointProjects(stage, careerGoal = "") {
  const topics = Array.isArray(stage?.tasks) ? stage.tasks : [];
  const topicSummary = topics.slice(0, 4).join(", ") || "the skills from this stage";
  const subject = `${careerGoal} ${topics.join(" ")}`.toLowerCase();
  let fallback = [];

  if (/html|css|web|frontend|website|responsive/.test(subject)) {
    fallback = [
      { title: "Responsive Student Portfolio", description: `Create a polished multi-page portfolio with a home page, about section, skills, projects and contact page using ${topicSummary}.`, difficulty: "Easy", estimatedTime: "3–5 hours" },
      { title: "College Club Website", description: `Build a website for a college club with an events section, team profiles, announcements and a responsive navigation menu. Apply ${topicSummary}.`, difficulty: "Easy", estimatedTime: "3–4 hours" },
      { title: "Product Showcase Website", description: `Design a product landing page with feature sections, pricing cards, testimonials and a clear call to action.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Event Registration Website", description: `Create a multi-page event website with event details, schedule, speaker profiles and a registration form layout.`, difficulty: "Medium", estimatedTime: "5–7 hours" },
      { title: "Personal Blog Layout", description: `Build a responsive blog with article cards, category navigation, an article page and a clean reading layout.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Restaurant Website", description: `Create a restaurant website with menu sections, opening hours, location details and a mobile-friendly design.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
    ];
  } else if (/python|data|statistics|sql|database|analytics|machine learning|ai|artificial intelligence/.test(subject)) {
    fallback = [
      { title: "Student Performance Analyzer", description: `Create a small application that organizes sample student data and summarizes patterns using ${topicSummary}.`, difficulty: "Easy", estimatedTime: "3–5 hours" },
      { title: "Personal Expense Tracker", description: `Build a program to record expenses, categorize transactions and calculate useful summaries and totals.`, difficulty: "Easy", estimatedTime: "3–5 hours" },
      { title: "Data Cleaning Toolkit", description: `Create reusable steps to inspect a dataset, handle missing values, remove duplicates and prepare it for analysis.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Interactive Data Report", description: `Analyze a small public dataset and present key findings with tables, charts and a short explanation.`, difficulty: "Medium", estimatedTime: "5–7 hours" },
      { title: "Mini Recommendation Engine", description: `Build a beginner-friendly recommendation prototype using simple rules or similarity scores from sample data.`, difficulty: "Hard", estimatedTime: "6–9 hours" },
      { title: "Quiz Results Database", description: `Design a small database or program to store quiz attempts, calculate scores and show learner performance.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
    ];
  } else if (/c programming|\bc\b|data structure|algorithm|dsa|problem solving/.test(subject)) {
    fallback = [
      { title: "Student Record Manager", description: `Build a menu-driven program to add, search, update and display student records using ${topicSummary}.`, difficulty: "Easy", estimatedTime: "3–5 hours" },
      { title: "Library Book Manager", description: `Create a program to store book details, search by title or ID and track issue and return status.`, difficulty: "Easy", estimatedTime: "4–5 hours" },
      { title: "Contact Directory", description: `Build a searchable contact manager with add, delete, update and sorting operations.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Expression Calculator", description: `Create a calculator that processes arithmetic expressions and demonstrates the concepts learned in this stage.`, difficulty: "Medium", estimatedTime: "5–7 hours" },
      { title: "Mini Search Engine", description: `Build a small keyword search tool that stores items and efficiently finds matching records.`, difficulty: "Hard", estimatedTime: "6–9 hours" },
      { title: "Task Scheduler", description: `Create a task manager that organizes tasks by priority and supports searching and updating.`, difficulty: "Medium", estimatedTime: "4–7 hours" },
    ];
  } else {
    fallback = [
      { title: "Beginner Skill Demonstrator", description: `Create a small practical demonstration that uses ${topicSummary} to solve one clear problem.`, difficulty: "Easy", estimatedTime: "3–5 hours" },
      { title: "Real-World Case Study", description: `Choose a familiar real-world problem, explain how the stage concepts apply and present a practical solution.`, difficulty: "Easy", estimatedTime: "3–4 hours" },
      { title: "Interactive Learning Tool", description: `Build a simple interactive tool that helps another student understand and practice ${topicSummary}.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Mini Automation Project", description: `Automate a repetitive task related to this subject and document how your solution works.`, difficulty: "Medium", estimatedTime: "4–6 hours" },
      { title: "Applied Problem-Solving Project", description: `Identify a practical challenge and develop a small working solution using the skills learned in this stage.`, difficulty: "Medium", estimatedTime: "5–7 hours" },
      { title: "Capstone Prototype", description: `Combine several concepts from this stage into a more complete prototype and explain its design decisions.`, difficulty: "Hard", estimatedTime: "6–9 hours" },
    ];
  }

  const supplied = Array.isArray(stage?.projects) ? stage.projects : [];
  const combined = [...supplied, ...fallback].map(project => ({
    title: String(project?.title || "Checkpoint project"),
    description: String(project?.description || `Apply ${topicSummary} in a practical project.`),
    difficulty: String(project?.difficulty || "Medium"),
    estimatedTime: String(project?.estimatedTime || "4–6 hours"),
  }));
  const seen = new Set();
  return combined.filter(project => {
    const key = project.title.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function App() {
  const [activeModal, setActiveModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [education, setEducation] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [customCareerGoal, setCustomCareerGoal] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [hasProjects, setHasProjects] = useState("");
  const [projects, setProjects] = useState([{ name: "", description: "", technologies: "" }]);
  const [dailyTime, setDailyTime] = useState("");
  const [mainTarget, setMainTarget] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeRoadmapGoal, setActiveRoadmapGoal] = useState("");
  const [isCreatingNewRoadmap, setIsCreatingNewRoadmap] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roadmapStages, setRoadmapStages] = useState([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const [roadmapRequestId, setRoadmapRequestId] = useState(0);
  const [roadmapView, setRoadmapView] = useState("path");
  const [completedTopics, setCompletedTopics] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [activeLearningSection, setActiveLearningSection] = useState("learn");
  const [completedTopicSections, setCompletedTopicSections] = useState({});
  const [learningSource, setLearningSource] = useState("nptel");
  const [youtubeCategory, setYoutubeCategory] = useState("oneshot");
  const [learningResources, setLearningResources] = useState({ playlists: [], videos: [], error: "", loading: false });
  const [activeLearningVideo, setActiveLearningVideo] = useState(null);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [nptelSearch, setNptelSearch] = useState("");
  const [selectedNptelCourse, setSelectedNptelCourse] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) setProfileError(error.message);
      setUser(data?.session?.user ?? null);
      setAuthReady(true);
    }
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // Every fresh login starts at the dashboard, never inside an old workspace.
      if (event === "SIGNED_IN") {
        setShowRoadmap(false);
        setSelectedTopic(null);
        setSelectedCheckpoint(null);
        setIsCreatingNewRoadmap(false);
        setMenuOpen(false);
        setActiveLearningSection("learn");
        setRoadmapView("path");
      }

      if (event === "SIGNED_OUT") {
        setShowRoadmap(false);
        setSelectedTopic(null);
        setSelectedCheckpoint(null);
        setIsCreatingNewRoadmap(false);
        setMenuOpen(false);
        setActiveLearningSection("learn");
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!user) { setProfile(null); setProfileLoading(false); return; }
      setProfileLoading(true); setProfileError("");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) { setProfileError(error.message); setProfileLoading(false); return; }
      let p = data;
      if (!p) {
        const { data: created, error: insertError } = await supabase.from("profiles").insert({ id: user.id, full_name: user.user_metadata?.full_name || "" }).select().single();
        if (cancelled) return;
        if (insertError) { setProfileError(insertError.message); setProfileLoading(false); return; }
        p = created;
      }
      setProfile(p);
      setFullName(p.full_name || user.user_metadata?.full_name || "");
      setEducation(p.education_level || "");
      const storedGoal = p.career_goal || "";
      setCareerGoal(CAREER_OPTIONS.includes(storedGoal) ? storedGoal : storedGoal ? "Other" : "");
      setCustomCareerGoal(storedGoal && !CAREER_OPTIONS.includes(storedGoal) ? storedGoal : "");
      setSkills(Array.isArray(p.existing_skills) ? p.existing_skills : []);
      setSkillLevel(p.skill_level || "");
      const savedProjects = Array.isArray(p.completed_projects) ? p.completed_projects : [];
      setHasProjects(savedProjects.length ? "yes" : p.has_completed_projects === false ? "no" : "");
      setProjects(savedProjects.length ? savedProjects : [{ name: "", description: "", technologies: "" }]);
      setDailyTime(p.daily_learning_time || "");
      setMainTarget(p.main_target || "");
      const done = Boolean(p.onboarding_completed);
      setOnboardingStep(done ? 1 : !p.full_name || !p.education_level ? 1 : !p.career_goal ? 2 : !p.existing_skills ? 3 : !p.skill_level ? 4 : !p.daily_learning_time ? 6 : !p.main_target ? 7 : 1);
      setProfileLoading(false);
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadSavedRoadmaps() {
      if (!user || !profile?.id || !profile.onboarding_completed) {
        setSavedRoadmaps([]);
        return;
      }
      const { data, error } = await supabase
        .from("user_roadmaps")
        .select("id, title, career_goal, roadmap, progress, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setProfileError(`Could not load saved roadmaps: ${error.message}`);
        return;
      }
      setSavedRoadmaps(data || []);
    }
    loadSavedRoadmaps();
    return () => { cancelled = true; };
  }, [user?.id, profile?.id, profile?.onboarding_completed]);

  const goToDashboard = () => {
    setShowRoadmap(false);
    setMenuOpen(false);
    setSelectedTopic(null);
    setSelectedCheckpoint(null);
    setActiveLearningSection("learn");
  };

  const startNewRoadmap = () => {
    setMenuOpen(false);
    setIsCreatingNewRoadmap(true);
    setShowRoadmap(false);
    setRoadmapStages([]);
    setCompletedTopics({});
    setActiveRoadmapId(null);
    setActiveRoadmapGoal("");
    setSelectedTopic(null);
    setSelectedCheckpoint(null);
    setOnboardingStep(1);
    setProfile(current => current ? { ...current, onboarding_completed: false } : current);
  };

  const cancelNewRoadmap = () => {
    setIsCreatingNewRoadmap(false);
    setShowRoadmap(false);
    setMenuOpen(false);
    setRoadmapStages([]);
    setActiveRoadmapId(null);
    setActiveRoadmapGoal("");
    setSelectedTopic(null);
    setSelectedCheckpoint(null);
    setProfile(current => current ? { ...current, onboarding_completed: true } : current);
  };

  const openSavedRoadmap = (item) => {
    const stages = Array.isArray(item.roadmap) ? item.roadmap : [];
    setActiveRoadmapId(item.id);
    setActiveRoadmapGoal(item.career_goal || item.title || "Your career roadmap");
    setRoadmapStages(stages);
    setCompletedTopics(item.progress?.completedTopics || {});
    setCompletedTopicSections(item.progress?.completedTopicSections || {});
    setRoadmapError("");
    setSelectedTopic(null);
    setSelectedCheckpoint(null);
    setActiveLearningSection("learn");
    setShowRoadmap(true);
    setMenuOpen(false);
  };

  const closeModal = () => { if (loading) return; setActiveModal(""); setFeedback(""); setFeedbackType(""); };
  const openModal = (type) => { setActiveModal(type); setFeedback(""); setFeedbackType(""); };

  const handleAuthSubmit = async (event) => {
    event.preventDefault(); if (loading) return;
    setLoading(true); setFeedback(""); setFeedbackType("");
    const formData = new FormData(event.currentTarget);
    const name = formData.get("fullName")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    try {
      if (activeModal === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setFeedback(data.session ? "Account created! Welcome to EMC." : "Account created! Please check your email for the confirmation link.");
        setFeedbackType("success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setFeedback("Login successful! Welcome back to EMC."); setFeedbackType("success");
      }
    } catch (error) { setFeedback(error.message || "Something went wrong. Please try again."); setFeedbackType("error"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { alert(error.message); return; }
    setUser(null); setProfile(null); setActiveModal(""); setFeedback(""); setFeedbackType("");
    setShowRoadmap(false); setSelectedTopic(null); setSelectedCheckpoint(null);
    setIsCreatingNewRoadmap(false); setMenuOpen(false); setActiveLearningSection("learn");
  };

  const saveProfileFields = async (fields) => {
    if (!user || savingProfile) return false;
    setSavingProfile(true); setProfileError("");
    // Keep onboarding incomplete during edits; only the final Generate My Roadmap
    // submission is allowed to mark the profile as completed.
    const { data, error } = await supabase.from("profiles").update({ onboarding_completed: fields.onboarding_completed ?? false, ...fields, updated_at: new Date().toISOString() }).eq("id", user.id).select().single();
    if (error) { setProfileError(error.message); setSavingProfile(false); return false; }
    setProfile(data); setSavingProfile(false); return true;
  };

  const nextStep = async (event) => {
    if (event?.preventDefault) event.preventDefault(); setProfileError("");
    if (onboardingStep === 1) {
      if (!fullName.trim() || !education) { setProfileError("Please enter your name and select your education level."); return; }
      if (await saveProfileFields({ full_name: fullName.trim(), education_level: education })) setOnboardingStep(2);
      return;
    }
    if (onboardingStep === 2) {
      const goal = careerGoal === "Other" ? customCareerGoal.trim() : careerGoal;
      if (!goal) { setProfileError("Please choose a career goal or enter your own."); return; }
      if (await saveProfileFields({ career_goal: goal })) { setCareerGoal(CAREER_OPTIONS.includes(goal) ? goal : "Other"); setCustomCareerGoal(CAREER_OPTIONS.includes(goal) ? "" : goal); setOnboardingStep(3); }
      return;
    }
  
    if (onboardingStep === 3) {
      const typedAnswer = skillSearch.trim().toLowerCase();
      const typedNoSkills = [
        "no skills",
        "none",
        "no skills learned",
        "nothing yet",
        "no skills yet",
      ].includes(typedAnswer);

      if (!skills.length && !typedNoSkills) {
        setProfileError(
          'Select a skill, or type "No skills" if you are a complete beginner.'
        );
        return;
      }

      const skillsToSave = typedNoSkills ? [] : skills;
      if (await saveProfileFields({ existing_skills: skillsToSave })) {
        setSkills(skillsToSave);
        if (typedNoSkills) setSkillLevel("Beginner");
        setProfileError("");
        setOnboardingStep(4);
      }
      return;
    }

    if (onboardingStep === 4) {
      if (!skillLevel) { setProfileError("Please choose your current skill level."); return; }
      if (await saveProfileFields({ skill_level: skillLevel })) setOnboardingStep(5);
      return;
    }
    if (onboardingStep === 5) {
      if (!hasProjects) { setProfileError("Please tell us whether you have completed any projects."); return; }
      const cleanProjects = hasProjects === "yes" ? projects.filter(p => p.name.trim() || p.description.trim() || p.technologies.trim()).map(p => ({ name: p.name.trim(), description: p.description.trim(), technologies: p.technologies.trim() })) : [];
      if (hasProjects === "yes" && !cleanProjects.length) { setProfileError("Add at least one completed project, or select No projects yet."); return; }
      if (hasProjects === "yes" && cleanProjects.some(p => !p.name || !p.description)) { setProfileError("Each project needs a name and description. Technologies are optional."); return; }
      if (await saveProfileFields({ has_completed_projects: hasProjects === "yes", completed_projects: cleanProjects })) { setProjects(cleanProjects.length ? cleanProjects : [{ name: "", description: "", technologies: "" }]); setOnboardingStep(6); }
      return;
    }
    if (onboardingStep === 6) {
      if (!dailyTime) { setProfileError("Please select how much time you can learn each day."); return; }
      if (await saveProfileFields({ daily_learning_time: dailyTime })) setOnboardingStep(7);
      return;
    }
    if (onboardingStep === 7) {
      if (!mainTarget) { setProfileError("Please select your main target."); return; }
      const goal = careerGoal === "Other" ? customCareerGoal.trim() : careerGoal;
      const cleanProjects = hasProjects === "yes" ? projects.filter(p => p.name.trim()).map(p => ({ name: p.name.trim(), description: p.description.trim(), technologies: p.technologies.trim() })) : [];
      const saved = await saveProfileFields({ full_name: fullName.trim(), education_level: education, career_goal: goal, existing_skills: skills, skill_level: skillLevel, has_completed_projects: hasProjects === "yes", completed_projects: cleanProjects, daily_learning_time: dailyTime, main_target: mainTarget, onboarding_completed: true });
      if (saved) setShowRoadmap(true);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    try {
      const saved = window.localStorage.getItem(`emc-roadmap-progress-${profile.id}`);
      setCompletedTopics(saved ? JSON.parse(saved) : {});
    } catch {
      setCompletedTopics({});
    }
  }, [profile?.id]);

  const toggleRoadmapTopic = (topicKey) => {
    setCompletedTopics((current) => {
      const next = { ...current, [topicKey]: !current[topicKey] };
      try {
        if (profile?.id) window.localStorage.setItem(`emc-roadmap-progress-${profile.id}`, JSON.stringify(next));
      } catch {
        // Progress still works for the current session if storage is unavailable.
      }
      if (activeRoadmapId && user?.id) {
        const progress = { completedTopics: next, completedTopicSections };
        supabase.from("user_roadmaps").update({ progress, updated_at: new Date().toISOString() })
          .eq("id", activeRoadmapId).eq("user_id", user.id)
          .then(({ error }) => { if (error) setProfileError(`Progress could not be saved: ${error.message}`); });
        setSavedRoadmaps(current => current.map(item => item.id === activeRoadmapId ? { ...item, progress } : item));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!showRoadmap || !profile || roadmapStages.length > 0) return;
    let cancelled = false;
    async function generatePersonalizedRoadmap() {
      setRoadmapLoading(true);
      setRoadmapError("");
      try {
        const payload = {
          fullName: profile.full_name || fullName,
          educationLevel: profile.education_level || education,
          careerGoal: profile.career_goal || (careerGoal === "Other" ? customCareerGoal : careerGoal),
          skillLevel: profile.skill_level || skillLevel,
          existingSkills: profile.existing_skills || skills,
          completedProjects: profile.completed_projects || projects.filter(p => p.name.trim()),
          hasCompletedProjects: profile.has_completed_projects ?? (hasProjects === "yes"),
          dailyLearningTime: profile.daily_learning_time || dailyTime,
          mainTarget: profile.main_target || mainTarget,
        };
        const { data, error } = await supabase.functions.invoke("generate-roadmap", { body: payload });
        if (error) throw new Error(error.message || "The AI roadmap service could not be reached.");
        const stages = data?.roadmap;
        if (!Array.isArray(stages) || stages.length === 0) throw new Error("The AI returned an empty roadmap. Please try again.");
        if (!cancelled) {
  const normalizedStages = stages.map((stage, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: String(stage.title || `Stage ${index + 1}`),
    description: String(stage.description || ""),
    tasks: Array.isArray(stage.tasks) ? stage.tasks.map(String) : [],
    checkpoint: String(stage.checkpoint || "Try a project using the skills from this stage."),
    timeline: String(stage.timeline || ""),
    projects: Array.isArray(stage.projects) ? stage.projects.map((project) => ({
      title: String(project?.title || "Project idea"),
      description: String(project?.description || "Apply the skills learned in this stage."),
      difficulty: String(project?.difficulty || "Medium"),
      estimatedTime: String(project?.estimatedTime || "A few hours"),
    })).slice(0, 3) : [],
  }));
  setRoadmapStages(normalizedStages);
  const goalTitle = profile.career_goal || "My Career Roadmap";
  const { data: savedRoadmap, error: saveError } = await supabase.from("user_roadmaps").insert({
    user_id: user.id,
    title: goalTitle,
    career_goal: goalTitle,
    roadmap: normalizedStages,
    progress: { completedTopics: {}, completedTopicSections: {} },
  }).select().single();
  if (saveError) throw new Error(`Roadmap generated, but saving it failed: ${saveError.message}`);
  if (!cancelled && savedRoadmap) {
    setActiveRoadmapId(savedRoadmap.id);
    setActiveRoadmapGoal(savedRoadmap.career_goal);
    setSavedRoadmaps(current => [savedRoadmap, ...current]);
    setIsCreatingNewRoadmap(false);
  }
}
      } catch (error) {
        if (!cancelled) setRoadmapError(error.message || "Could not generate your roadmap.");
      } finally {
        if (!cancelled) setRoadmapLoading(false);
      }
    }
    generatePersonalizedRoadmap();
    return () => { cancelled = true; };
  }, [showRoadmap, profile?.id, roadmapRequestId]);

  useEffect(() => {
    if (!selectedTopic || activeLearningSection !== "learn") return;
    let cancelled = false;
    async function loadLearningResources() {
      setLearningResources({ playlists: [], videos: [], error: "", loading: false });
      setActiveLearningVideo(null);
      setActivePlaylist(null);
      setSelectedNptelCourse(null);
      if (learningSource === "nptel") return; // NPTEL uses the official catalogue, not guessed Gemini playlist IDs.
      setLearningResources({ playlists: [], videos: [], error: "", loading: true });
      try {
        const { data, error } = await supabase.functions.invoke("get-learning-resources", {
          body: { topic: selectedTopic.title, source: learningSource, category: youtubeCategory }
        });
        if (error) throw new Error(error.message || "Could not load learning resources.");
        if (data?.error) throw new Error(data.error);
        if (!cancelled) {
          setLearningResources({ playlists: data?.playlists || [], videos: data?.videos || [], error: "", loading: false });
          if (learningSource === "nptel" && data?.playlists?.length) setActivePlaylist(data.playlists[0]);
          if (learningSource === "youtube" && data?.videos?.length) setActiveLearningVideo(data.videos[0]);
        }
      } catch (error) {
        if (!cancelled) setLearningResources({ playlists: [], videos: [], error: error.message || "Learning resources could not be loaded.", loading: false });
      }
    }
    loadLearningResources();
    return () => { cancelled = true; };
  }, [selectedTopic?.key, selectedTopic?.title, activeLearningSection, learningSource, youtubeCategory]);

  const availableSkills = useMemo(() => {
    const goal = careerGoal === "Other" ? "Other" : careerGoal;
    const list = SKILLS_BY_CAREER[goal] || SKILLS_BY_CAREER["Software Engineer"];
    const q = skillSearch.trim().toLowerCase();
    return list.filter(skill => skill.toLowerCase().includes(q));
  }, [careerGoal, skillSearch]);
  const filteredCareers = useMemo(() => CAREER_OPTIONS.filter(goal => goal.toLowerCase().includes(careerSearch.trim().toLowerCase())), [careerSearch]);
  const toggleSkill = (skill) => setSkills(current => current.includes(skill) ? current.filter(item => item !== skill) : [...current, skill]);

  if (!authReady || (user && profileLoading)) return <main className="emc-page"><div className="emc-loading">Preparing your EMC experience...</div></main>;

  if (user && profileError && !profile) return <main className="emc-page"><header className="emc-header"><span className="emc-logo">EMC</span><p className="brand-caption">ENVISION · MASTER · CONQUER</p></header><section className="onboarding-panel"><h1>We couldn't load your profile</h1><p>{profileError}</p><div className="onboarding-actions"><button className="btn btn-outline" onClick={() => window.location.reload()}>Try again</button><button className="btn btn-gold" onClick={handleLogout}>Logout</button></div></section></main>;

  if (user && profile && (!profile.onboarding_completed || showRoadmap)) {
    if (showRoadmap) {
      const goal = activeRoadmapGoal || profile?.career_goal || (careerGoal === "Other" ? customCareerGoal : careerGoal);

return (
  <main className="emc-page">
    <header className="emc-header roadmap-topbar">
      <div className="roadmap-brand"><span className="emc-logo">EMC</span><p className="brand-caption">ENVISION · MASTER · CONQUER</p></div>
      <div className="roadmap-topbar-actions">
        <button className="emc-menu-button" type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>☰</button>
      </div>
      {menuOpen && <nav className="emc-menu-popover" aria-label="Main navigation">
        <button type="button" onClick={goToDashboard}>⌂ <span>Dashboard</span></button>
        <button type="button" onClick={goToDashboard}>◇ <span>My Roadmaps</span></button>
        <button type="button" onClick={startNewRoadmap}>＋ <span>Create New Roadmap</span></button>
        <button type="button" onClick={() => { setActiveLearningSection("learn"); setMenuOpen(false); }}>▤ <span>Learn</span></button>
        <button type="button" onClick={() => { setActiveLearningSection("practice"); setMenuOpen(false); }}>⌘ <span>Practice</span></button>
        <button type="button" onClick={() => { setActiveLearningSection("assignments"); setMenuOpen(false); }}>✓ <span>Assignments</span></button>
        <button type="button" onClick={() => { setMenuOpen(false); setOnboardingStep(1); setProfile(current => ({ ...current, onboarding_completed: false })); }}>◎ <span>My Profile</span></button>
        <button type="button" onClick={handleLogout}>↪ <span>Logout</span></button>
      </nav>}
    </header>

    <section className="onboarding-panel roadmap-panel">
      <p className="eyebrow">{goal.toUpperCase()} ROADMAP</p>
      <h1>Your journey starts here.</h1>
      <p className="onboarding-intro roadmap-subtitle">A learning path designed around your career goal.</p>
      <div className="roadmap-summary roadmap-summary-compact roadmap-summary-readable">
        <div><span>Goal:</span><strong>{goal || "Not set"}</strong></div>
        <div><span>Level:</span><strong>{profile.skill_level || skillLevel || "Not set"}</strong></div>
        <div><span>Daily time:</span><strong>{profile.daily_learning_time || dailyTime || "Not set"}</strong></div>
        <div><span>Main target:</span><strong>{profile.main_target || mainTarget || "Not set"}</strong></div>
      </div>
      <h2 className="roadmap-heading">Your personalized learning path</h2>

      {roadmapLoading && <div className="roadmap-status" role="status"><span className="roadmap-spinner" /> <div><strong>EMC is building your roadmap...</strong><p>Using your skills, projects, available time, and target to create your personal plan.</p></div></div>}
      {roadmapError && <div className="roadmap-error" role="alert"><p>{roadmapError}</p><button className="btn btn-gold" type="button" onClick={() => setRoadmapRequestId(value => value + 1)}>Try generating again</button></div>}
      {!roadmapLoading && !roadmapError && roadmapStages.length > 0 && (() => {
        const totalTopics = roadmapStages.reduce((sum, stage) => sum + stage.tasks.length, 0);
        const completedCount = roadmapStages.reduce((sum, stage) => sum + stage.tasks.filter((_, index) => completedTopics[`${stage.number}-${index}`]).length, 0);
        const progress = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;
        let currentStageNumber = roadmapStages.find(stage => stage.tasks.some((_, index) => !completedTopics[`${stage.number}-${index}`]))?.number;
        if (selectedCheckpoint) {
          const checkpointStage = roadmapStages.find(stage => String(stage.number) === String(selectedCheckpoint.stageNumber));
          if (checkpointStage) {
            const checkpointProjects = getCheckpointProjects(checkpointStage, goal);
            return <div className="emc-checkpoint-workspace">
              <button type="button" className="emc-workspace-back" onClick={() => setSelectedCheckpoint(null)}>← Back to learning roadmap</button>
              <div className="emc-checkpoint-hero">
                <p className="eyebrow">PROJECT WORKSPACE · CHECKPOINT {roadmapStages.findIndex(stage => stage.number === checkpointStage.number) + 1}</p>
                <h2>{checkpointStage.checkpoint || "Stage project checkpoint"}</h2>
                <p>You have completed this stage. Choose a project idea and build it at your own pace. Every suggestion is optional.</p>
                <div className="emc-checkpoint-topic-list"><strong>Skills covered</strong><div>{checkpointStage.tasks.map((task, index) => <span key={`${checkpointStage.number}-skill-${index}`}>{task}</span>)}</div></div>
              </div>
              <div className="emc-checkpoint-project-heading"><div><span className="eyebrow">YOUR NEXT BUILD</span><h3>Choose a project to explore</h3></div><span>{checkpointProjects.length} project ideas</span></div>
              <div className="emc-checkpoint-project-grid">
                {checkpointProjects.map((project, index) => <article className="emc-checkpoint-project-card" key={`${checkpointStage.number}-idea-${index}`}>
                  <div className="emc-checkpoint-project-meta"><span>PROJECT {String(index + 1).padStart(2, "0")}</span><span>{project.difficulty}</span></div>
                  <h4>{project.title}</h4>
                  <p>{project.description}</p>
                  <div className="emc-checkpoint-project-footer"><span>◷ {project.estimatedTime}</span><span>Optional · Self-paced</span></div>
                </article>)}
              </div>
              <p className="emc-checkpoint-note">These are independent practice ideas, not graded assignments. Pick any one, modify it, or create your own project.</p>
            </div>;
          }
          return <div className="emc-checkpoint-workspace"><button type="button" className="emc-workspace-back" onClick={() => setSelectedCheckpoint(null)}>← Back to learning roadmap</button><h2>Checkpoint unavailable</h2><p>This checkpoint could not be found in the active roadmap. Return to the roadmap and open it again.</p></div>;
        }
        if (selectedTopic) {
          const sectionKey = selectedTopic.key;
          const sectionStatus = completedTopicSections[sectionKey] || {};
          const allSectionsDone = ["learn", "assignments", "practice"].every(section => sectionStatus[section]);
          const sectionLabels = { learn: "Learn", assignments: "Assignments", practice: "Practice" };
          return <div className="emc-learning-workspace">
            <button type="button" className="emc-workspace-back" onClick={() => setSelectedTopic(null)}>← Back to learning roadmap</button>
            <div className="emc-workspace-heading">
              <p className="eyebrow">YOUR LEARNING WORKSPACE · {selectedTopic.stage}</p>
              <h2>{selectedTopic.title}</h2>
              <p>Build your understanding step by step. Complete all three sections to finish this topic.</p>
            </div>
            <div className="emc-workspace-tabs" role="tablist" aria-label="Learning sections">
              {["learn", "assignments", "practice"].map(section => <button type="button" role="tab" aria-selected={activeLearningSection === section} className={activeLearningSection === section ? "active" : ""} key={section} onClick={() => setActiveLearningSection(section)}>
                <span>{sectionLabels[section]}</span>{sectionStatus[section] && <span className="emc-section-check">✓</span>}
              </button>)}
            </div>
            <div className="emc-workspace-content">
              {activeLearningSection === "learn" && <div className="emc-resource-hub">
                <div className="emc-source-switch" role="tablist" aria-label="Learning source">
                  <button type="button" className={learningSource === "nptel" ? "active" : ""} onClick={() => setLearningSource("nptel")}>NPTEL <small>Official courses</small></button>
                  <button type="button" className={learningSource === "youtube" ? "active" : ""} onClick={() => setLearningSource("youtube")}>YouTube <small>Video lessons</small></button>
                </div>
                {learningSource === "youtube" && <div className="emc-video-filters" aria-label="YouTube learning type">
                  {[ ["quick", "Quick learning"], ["oneshot", "One-shot"], ["complete", "Complete courses"], ["project", "Project-based"] ].map(([value, label]) => <button type="button" key={value} className={youtubeCategory === value ? "active" : ""} onClick={() => setYoutubeCategory(value)}>{label}</button>)}
                </div>}
                <div className="emc-resource-intro">
                  <div><h3>{learningSource === "nptel" ? `${selectedTopic.title} · NPTEL courses` : `${selectedTopic.title} · YouTube library`}</h3>
                  <p>{learningSource === "nptel" ? "We’ll check for NPTEL courses that genuinely match this topic. Unrelated courses are never shown." : "Explore topic-matched videos, from beginner explanations to complete courses and practical examples."}</p></div>
                  <span className="emc-resource-topic">{selectedTopic.title}</span>
                </div>
                {learningResources.loading && <div className="emc-resource-state"><span className="roadmap-spinner"/><strong>Finding verified learning resources…</strong><small>Checking titles, channels, playlists and video details.</small></div>}
                {!learningResources.loading && learningResources.error && <div className="emc-resource-state is-error"><strong>Resources couldn't be loaded</strong><small>{learningResources.error}</small><small>Check that the get-learning-resources Supabase function is deployed and YOUTUBE_API_KEY is configured.</small></div>}
                {learningSource === "nptel" && <NptelCourseBrowser
                  topic={selectedTopic.title}
                  selectedCourse={selectedNptelCourse}
                  setSelectedCourse={setSelectedNptelCourse}
                  onExploreYoutube={() => setLearningSource("youtube")}
                />}
                {!learningResources.loading && !learningResources.error && learningSource === "youtube" && <>
                  {learningResources.videos.length > 0 ? <div className="emc-video-library-layout">
                    <div className="emc-video-results"><div className="emc-list-heading">Recommended videos <span>{learningResources.videos.length}</span></div>
                      {learningResources.videos.map(video => <button type="button" key={video.id} className={`emc-video-choice ${activeLearningVideo?.id === video.id ? "active" : ""}`} onClick={() => setActiveLearningVideo(video)}><img src={video.thumbnail} alt="" loading="lazy"/><span className="emc-video-choice-copy"><strong>{video.title}</strong><small>{video.channelTitle}</small><small>{video.durationLabel} · {video.publishedAt ? new Date(video.publishedAt).getFullYear() : ""}</small></span></button>)}
                    </div>
                    <div className="emc-video-detail">{activeLearningVideo && <div className="emc-video-study-layout"><div><div className="emc-player-frame"><iframe title={activeLearningVideo.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeLearningVideo.id)}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div><div className="emc-player-caption"><strong>{activeLearningVideo.title}</strong><span>{activeLearningVideo.channelTitle} · {activeLearningVideo.durationLabel}</span><p>{activeLearningVideo.description || "Video selected for this topic."}</p></div></div><AskEmcPanel topic={selectedTopic.title} lessonTitle={activeLearningVideo.title} lessonDescription={activeLearningVideo.description || ""} /></div>}</div>
                  </div> : <div className="emc-resource-state"><strong>No videos found for this filter.</strong><small>Try another learning format or a broader topic name.</small></div>}
                </>}
                <p className="emc-resource-disclaimer">Videos play inside EMC using the official YouTube embed player. Ask EMC AI is available beside the lesson. Video availability and playback are controlled by YouTube and each channel.</p>
              </div>}
             {activeLearningSection === "assignments" && (
  <>
    <h3>Assignments</h3>
    <p className="emc-workspace-lead">
      Check your conceptual understanding with guided questions and topic-based tasks.
    </p>
    <ConceptAssignments
      topic={selectedTopic.title}
      careerPath={profile?.career_goal || careerGoal || "General"}
    />
  </>
)}
             {activeLearningSection === "practice" && <>
  <h3>Practice</h3>
  <p className="emc-workspace-lead">
    Apply what you learned with hands-on exercises and practical challenges.
  </p>

  <PracticeWorkspace topic={selectedTopic.title} />
</>}
            </div>
            <div className="emc-workspace-footer">
              <span>{["learn", "assignments", "practice"].filter(section => sectionStatus[section]).length} of 3 sections completed</span>
              <button type="button" className="btn btn-gold" disabled={Boolean(sectionStatus[activeLearningSection])} onClick={() => setCompletedTopicSections(current => ({ ...current, [sectionKey]: { ...(current[sectionKey] || {}), [activeLearningSection]: true } }))}>
                {sectionStatus[activeLearningSection] ? `${sectionLabels[activeLearningSection]} completed` : `Mark ${sectionLabels[activeLearningSection]} complete`}
              </button>
              {allSectionsDone && <button type="button" className="btn btn-gold" onClick={() => { if (!completedTopics[sectionKey]) toggleRoadmapTopic(sectionKey); setSelectedTopic(null); setActiveLearningSection("learn"); }}>Complete topic and return to roadmap</button>}
            </div>
          </div>;
        }
        return <div className="roadmap-experience">
          <div className="roadmap-toolbar">
            <div className="roadmap-progress-summary">
              <div className="roadmap-progress-copy"><strong>Overall progress</strong><span>{completedCount} of {totalTopics} topics completed</span></div>
              <div className="roadmap-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progress}%` }} /></div>
              <strong className="roadmap-progress-percent">{progress}%</strong>
            </div>
            <div className="roadmap-view-actions">
              <button type="button" className={roadmapView === "path" ? "active" : ""} onClick={() => setRoadmapView("path")}>✦ Learning path</button>
              <button type="button" className={roadmapView === "list" ? "active" : ""} onClick={() => setRoadmapView("list")}>☷ View as list</button>
            </div>
          </div>
          <div className={`roadmap-visual ${roadmapView === "list" ? "is-list-view" : ""}`}>
            {roadmapStages.map((stage, stageIndex) => {
              const stageDone = stage.tasks.length > 0 && stage.tasks.every((_, index) => completedTopics[`${stage.number}-${index}`]);
              const stageDoneCount = stage.tasks.filter((_, index) => completedTopics[`${stage.number}-${index}`]).length;
              return <section className={`roadmap-stage ${stageDone ? "is-complete" : ""} ${stage.number === currentStageNumber ? "is-current" : ""}`} key={stage.number}>
                <div className="roadmap-stage-heading">
                  <span className="roadmap-stage-number">{stageDone ? "✓" : stageIndex + 1}</span>
                  <div className="roadmap-stage-title"><h3>{stage.title}</h3><p>{stage.description}</p></div>
                  <span className="roadmap-stage-count">{stageDoneCount}/{stage.tasks.length} completed</span>
                  {stage.timeline && <span className="roadmap-timeline">{stage.timeline}</span>}
                </div>
                <div className="roadmap-stage-content">
                  <div className="roadmap-topic-path">
                    {stage.tasks.map((task, index) => {
                      const key = `${stage.number}-${index}`;
                      const isDone = Boolean(completedTopics[key]);
                      const isNext = !isDone && stage.number === currentStageNumber && stage.tasks.slice(0, index).every((_, previousIndex) => completedTopics[`${stage.number}-${previousIndex}`]);
                      return <button type="button" key={key} className={`roadmap-topic-node ${isDone ? "is-done" : ""} ${isNext ? "is-next" : ""}`} onClick={() => { setSelectedTopic({ key, title: task, stage: stage.title }); setActiveLearningSection("learn"); }} aria-pressed={isDone} title="Open learning workspace">
                        <span className="roadmap-topic-status">{isDone ? "✓" : String(index + 1).padStart(2, "0")}</span><span className="roadmap-topic-label">{task}</span><span className="roadmap-topic-check">{isDone ? "✓" : "+"}</span>
                      </button>;
                    })}
                  </div>
                  <button type="button" className={`roadmap-checkpoint ${stageDone ? "is-ready" : "is-locked"}`} disabled={!stageDone} onClick={() => setSelectedCheckpoint({ stageNumber: stage.number })} aria-label={stageDone ? `Open checkpoint ${stageIndex + 1} projects` : `Checkpoint ${stageIndex + 1} locked until all stage topics are completed`}>
                    <span className="roadmap-checkpoint-icon">{stageDone ? (stageIndex === roadmapStages.length - 1 ? "🏆" : "◇") : "🔒"}</span>
                    <span className="roadmap-checkpoint-copy"><small>{stageIndex === roadmapStages.length - 1 ? "STAGE GOAL" : `CHECKPOINT ${stageIndex + 1}`}</small><strong>{stage.checkpoint}</strong><em>{stageDone ? "Stage complete — open your project workspace →" : `${stageDoneCount}/${stage.tasks.length} topics completed · checkpoint locked`}</em></span>
                    <span className="roadmap-checkpoint-action">{stageDone ? "Explore projects ↗" : "Locked"}</span>
                  </button>
                </div>
              </section>;
            })}
          </div>
          <div className="roadmap-next-step"><span className="roadmap-next-icon">➜</span><div><small>CURRENT FOCUS</small><strong>{roadmapStages.find(stage => stage.number === currentStageNumber)?.tasks.find((_, index) => !completedTopics[`${currentStageNumber}-${index}`]) || "Roadmap completed — amazing work!"}</strong><p>Mark each topic complete as you learn. Your progress is saved on this device.</p></div></div>
        </div>;
      })()}

      <p className="onboarding-note roadmap-footnote">Your roadmap is personalized from your skills, projects, available learning time, and career target.</p>

      <div className="onboarding-actions">
        <button className="btn btn-outline" onClick={() => { setShowRoadmap(false); setOnboardingStep(1); setProfile(p => ({ ...p, onboarding_completed: false })); }}>Edit answers</button>

      




      </div>
    </section>
  </main>
);

    }
    const progress = `${Math.round((onboardingStep / 7) * 100)}%`;
    const stepLabel = STEPS[onboardingStep - 1].toUpperCase();
    return <main className="emc-page"><header className="emc-header"><span className="emc-logo">EMC</span><p className="brand-caption">ENVISION · MASTER · CONQUER</p><div className="onboarding-header-actions">{isCreatingNewRoadmap && <button className="btn btn-outline" type="button" onClick={cancelNewRoadmap}>Cancel · Back to Dashboard</button>}<button className="btn btn-outline header-logout" onClick={handleLogout}>Logout</button></div></header><section className="onboarding-panel onboarding-wide"><div className="onboarding-progress"><p className="eyebrow">STEP {onboardingStep} OF 7 · {stepLabel}</p><div className="progress-track" aria-label={`Step ${onboardingStep} of 7`}><span style={{ width: progress }} /></div></div>
      {onboardingStep === 1 && <><h1>Let's start with you.</h1><p className="onboarding-intro">A few basics will help us shape your personal learning journey.</p><form className="onboarding-form" onSubmit={nextStep}><label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" required /></label><label>Education level<select value={education} onChange={e => setEducation(e.target.value)} required><option value="">Select your education level</option>{EDUCATION_OPTIONS.map(item => <option key={item}>{item}</option>)}</select></label>{errorBlock(profileError)}<button className="btn btn-gold onboarding-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving..." : "Next: Choose career goal"}</button></form></>}
      {onboardingStep === 2 && <><h1>Choose your career goal.</h1><p className="onboarding-intro">Select one goal from the clickable career cards. Search to find your path.</p><input className="search-field" value={careerSearch} onChange={e => setCareerSearch(e.target.value)} placeholder="⌕  Search 30+ career goals..." aria-label="Search career goals"/><div className="choice-grid career-grid">{filteredCareers.map(goal => <button type="button" key={goal} className={`choice-card ${careerGoal === goal ? "selected" : ""}`} onClick={() => { setCareerGoal(goal); setProfileError(""); }}>{goal}</button>)}</div>{careerGoal === "Other" && <label className="standalone-label">Enter your career goal<input value={customCareerGoal} onChange={e => setCustomCareerGoal(e.target.value)} placeholder="Type your career goal" /></label>}{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(1)}>Back</button><button className="btn btn-gold" type="button" disabled={savingProfile} onClick={nextStep}>{savingProfile ? "Saving..." : "Next: Existing skills"}</button></div></>}
      {onboardingStep === 3 && <><h1>What skills do you have?</h1><p className="onboarding-intro">Choose all skills you already know or have tried. Options are tailored to {careerGoal === "Other" ? customCareerGoal || "your goal" : careerGoal}.</p><input className="search-field" value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="⌕  Search skills..." aria-label="Search skills"/><div className="selected-count">{skills.length} skill{skills.length === 1 ? "" : "s"} selected</div><div className="choice-grid skill-grid">{availableSkills.map(skill => <button type="button" key={skill} className={`choice-card ${skills.includes(skill) ? "selected" : ""}`} onClick={() => toggleSkill(skill)}>{skills.includes(skill) && <span className="check-mark">✓ </span>}{skill}</button>)}</div>{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(2)}>Back</button><button className="btn btn-gold" type="button" onClick={nextStep} disabled={savingProfile}>{savingProfile ? "Saving..." : "Next: Skill level"}</button></div></>}
      {onboardingStep === 4 && <><h1>Where are you right now?</h1><p className="onboarding-intro">Choose the level that best describes your current knowledge.</p><div className="choice-grid level-grid">{LEVEL_OPTIONS.map(level => <button type="button" key={level} className={`choice-card level-card ${skillLevel === level ? "selected" : ""}`} onClick={() => setSkillLevel(level)}><strong>{level}</strong><small>{level === "Beginner" ? "I'm just getting started" : level === "Intermediate" ? "I know the basics and can practice" : "I can work independently"}</small></button>)}</div>{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(3)}>Back</button><button className="btn btn-gold" type="button" onClick={nextStep} disabled={savingProfile}>{savingProfile ? "Saving..." : "Next: Projects"}</button></div></>}
      {onboardingStep === 5 && <><h1>Have you completed projects?</h1><p className="onboarding-intro">Only add projects you've finished. You can add ongoing projects to your portfolio later.</p><div className="choice-grid yes-no-grid"><button type="button" className={`choice-card ${hasProjects === "yes" ? "selected" : ""}`} onClick={() => { setHasProjects("yes"); if (!projects.length) setProjects([{ name: "", description: "", technologies: "" }]); }}>Yes, I've completed projects</button><button type="button" className={`choice-card ${hasProjects === "no" ? "selected" : ""}`} onClick={() => setHasProjects("no")}>No projects yet</button></div>{hasProjects === "yes" && <div className="project-list">{projects.map((project, index) => <div className="project-editor" key={index}><div className="project-title-row"><h3>Completed project {index + 1}</h3>{projects.length > 1 && <button className="text-button remove-project" type="button" onClick={() => setProjects(current => current.filter((_, i) => i !== index))}>Remove</button>}</div><label>Project name<input value={project.name} onChange={e => setProjects(current => current.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} placeholder="e.g. Student management system" /></label><label>What did you build?<textarea value={project.description} onChange={e => setProjects(current => current.map((p, i) => i === index ? { ...p, description: e.target.value } : p))} placeholder="Briefly describe the finished project" rows={3} /></label><label>Technologies used (optional)<input value={project.technologies} onChange={e => setProjects(current => current.map((p, i) => i === index ? { ...p, technologies: e.target.value } : p))} placeholder="e.g. C, MySQL, React" /></label></div>)}<button type="button" className="btn btn-outline add-project" onClick={() => setProjects(current => [...current, { name: "", description: "", technologies: "" }])}>+ Add another completed project</button></div>}{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(4)}>Back</button><button className="btn btn-gold" type="button" onClick={nextStep} disabled={savingProfile}>{savingProfile ? "Saving..." : "Next: Learning time"}</button></div></>}
      {onboardingStep === 6 && <><h1>How much time can you learn daily?</h1><p className="onboarding-intro">We'll use this to keep your roadmap realistic and achievable.</p><div className="choice-grid time-grid">{TIME_OPTIONS.map(time => <button type="button" key={time} className={`choice-card ${dailyTime === time ? "selected" : ""}`} onClick={() => setDailyTime(time)}>{time}</button>)}</div>{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(5)}>Back</button><button className="btn btn-gold" type="button" onClick={nextStep} disabled={savingProfile}>{savingProfile ? "Saving..." : "Next: Main target"}</button></div></>}
      {onboardingStep === 7 && <><h1>What is your main target?</h1><p className="onboarding-intro">Choose the outcome you most want EMC to help you achieve.</p><div className="choice-grid target-grid">{TARGET_OPTIONS.map(target => <button type="button" key={target} className={`choice-card ${mainTarget === target ? "selected" : ""}`} onClick={() => setMainTarget(target)}>{target}</button>)}</div>{errorBlock(profileError)}<div className="onboarding-actions"><button className="btn btn-outline" type="button" onClick={() => setOnboardingStep(6)}>Back</button><button className="btn btn-gold" type="button" onClick={nextStep} disabled={savingProfile}>{savingProfile ? "Saving your profile..." : "Generate My Roadmap"}</button></div><p className="onboarding-note">Your answers will be saved to your EMC profile before the roadmap preview opens.</p></>}
      </section></main>;
  }
  if (user && profile?.onboarding_completed) {
    const savedSkills = Array.isArray(profile.existing_skills) ? profile.existing_skills : [];
    const totalTopics = roadmapStages.reduce((sum, stage) => sum + (stage.tasks?.length || 0), 0);
    const completedCount = roadmapStages.reduce(
      (sum, stage) => sum + (stage.tasks || []).filter((_, index) => completedTopics[`${stage.number}-${index}`]).length,
      0
    );
    const progressPercent = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;

    return (
      <main className="emc-dashboard-page">
        <aside className="emc-dashboard-sidebar">
          <div className="emc-dashboard-brand">
            <span className="emc-logo">EMC</span>
            <small>ENVISION · MASTER · CONQUER</small>
          </div>
          <p className="emc-dashboard-nav-label">WORKSPACE</p>
          <button className="emc-dashboard-nav active" type="button" onClick={goToDashboard}>⌂ <span>Dashboard</span></button>
          <button className="emc-dashboard-nav" type="button" onClick={() => document.getElementById("emc-roadmaps-section")?.scrollIntoView({ behavior: "smooth" })}>◇ <span>My Roadmaps</span></button>
          <button className="emc-dashboard-nav" type="button" onClick={startNewRoadmap}>＋ <span>New Roadmap</span></button>
          <button className="emc-dashboard-nav" type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("learn"); }}>▤ <span>Learn</span></button>
          <button className="emc-dashboard-nav" type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("practice"); }}>⌘ <span>Practice</span></button>
          <button className="emc-dashboard-nav" type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("assignments"); }}>✓ <span>Assignments</span></button>
          <div className="emc-dashboard-sidebar-bottom">
            <div className="emc-dashboard-user">
              <div className="emc-dashboard-avatar">{(profile.full_name || "L").charAt(0).toUpperCase()}</div>
              <div><strong>{profile.full_name || "Learner"}</strong><small>{profile.career_goal || "EMC Learner"}</small></div>
            </div>
            <button className="emc-dashboard-logout" onClick={handleLogout}>↪ <span>Logout</span></button>
          </div>
        </aside>

        <section className="emc-dashboard-main">
          <header className="emc-dashboard-topbar">
            <div className="emc-dashboard-title-wrap"><button className="emc-menu-button dashboard-menu-button" type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>☰</button><div><span className="emc-dashboard-kicker">YOUR PERSONAL WORKSPACE</span><h1>Dashboard</h1></div></div>
            <div className="emc-dashboard-top-actions">
              <span className="emc-dashboard-status">● Your journey is active</span>
              <button className="emc-dashboard-profile-button" type="button" onClick={() => { setOnboardingStep(1); setProfile(current => ({ ...current, onboarding_completed: false })); }}>Edit profile</button>
            </div>
          </header>
          {menuOpen && <nav className="emc-menu-popover dashboard-menu-popover" aria-label="Main navigation">
            <button type="button" onClick={goToDashboard}>⌂ <span>Dashboard</span></button>
            <button type="button" onClick={() => { document.getElementById("emc-roadmaps-section")?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); }}>◇ <span>My Roadmaps</span></button>
            <button type="button" onClick={startNewRoadmap}>＋ <span>Create New Roadmap</span></button>
            <button type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("learn"); setMenuOpen(false); }}>▤ <span>Learn</span></button>
            <button type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("practice"); setMenuOpen(false); }}>⌘ <span>Practice</span></button>
            <button type="button" onClick={() => { setShowRoadmap(true); setActiveLearningSection("assignments"); setMenuOpen(false); }}>✓ <span>Assignments</span></button>
            <button type="button" onClick={() => { setMenuOpen(false); setOnboardingStep(1); setProfile(p => ({ ...p, onboarding_completed: false })); }}>◎ <span>My Profile</span></button>
            <button type="button" onClick={handleLogout}>↪ <span>Logout</span></button>
          </nav>}

          <section className="emc-dashboard-welcome">
            <div>
              <span className="emc-dashboard-kicker">ENVISION. MASTER. CONQUER.</span>
              <h2>Welcome back, {profile.full_name?.split(" ")[0] || "Learner"}.</h2>
              <p>Small steps every day build the future you want. Ready to continue?</p>
              <button className="emc-dashboard-primary" type="button" onClick={() => savedRoadmaps[0] ? openSavedRoadmap(savedRoadmaps[0]) : startNewRoadmap()}>Continue learning <span>→</span></button>
            </div>
            <div className="emc-dashboard-orbit" aria-hidden="true"><span>EMC</span><i>✦</i></div>
          </section>

          <div className="emc-dashboard-section-heading"><div><span className="emc-dashboard-kicker">YOUR OVERVIEW</span><h2>Learning at a glance</h2></div></div>
          <section className="emc-dashboard-stats">
            <article className="emc-dashboard-stat"><span className="emc-dashboard-stat-icon">◎</span><small>CAREER GOAL</small><strong>{profile.career_goal || "Not selected"}</strong><p>Your direction</p></article>
            <article className="emc-dashboard-stat"><span className="emc-dashboard-stat-icon">◷</span><small>DAILY LEARNING</small><strong>{profile.daily_learning_time || "Not set"}</strong><p>Your daily commitment</p></article>
            <article className="emc-dashboard-stat"><span className="emc-dashboard-stat-icon">↗</span><small>TOPIC PROGRESS</small><strong>{progressPercent}%</strong><p>{completedCount} of {totalTopics} topics completed</p></article>
          </section>

          <section className="emc-roadmaps-section" id="emc-roadmaps-section">
            <div className="emc-roadmaps-heading"><div><span className="emc-dashboard-kicker">YOUR LEARNING PATHS</span><h2>My Roadmaps</h2><p>Keep different career goals and learning journeys organised in one place.</p></div><button className="emc-dashboard-primary" type="button" onClick={startNewRoadmap}>＋ Create New Roadmap</button></div>
            <div className="emc-roadmap-card-grid">
              {savedRoadmaps.map((item) => {
                const stages = Array.isArray(item.roadmap) ? item.roadmap : [];
                const total = stages.reduce((sum, stage) => sum + (stage.tasks?.length || 0), 0);
                const done = stages.reduce((sum, stage) => sum + (stage.tasks || []).filter((_, index) => item.progress?.completedTopics?.[`${stage.number}-${index}`]).length, 0);
                const percent = total ? Math.round(done / total * 100) : 0;
                const title = item.title || item.career_goal || "Career Roadmap";
                return <article className="emc-roadmap-mini-card" key={item.id}>
                  <div className="emc-roadmap-mini-icon">{title.toLowerCase().includes("web") ? "⌘" : title.toLowerCase().includes("software") ? "{ }" : "◇"}</div>
                  <h3>{title}</h3><p>{title.toLowerCase().includes("web") ? "Frontend · Backend · Full stack" : title.toLowerCase().includes("software") ? "Programming · DSA · Projects" : "Your personalised career learning path"}</p>
                  <div className="emc-dashboard-progress-track"><span style={{ width: `${percent}%` }} /></div>
                  <div className="emc-dashboard-progress-label"><span>{done} of {total} topics completed</span><strong>{percent}%</strong></div>
                  <button className="emc-dashboard-text-action" type="button" onClick={() => openSavedRoadmap(item)}>Open roadmap <span>→</span></button>
                </article>;
              })}
              <button className="emc-roadmap-create-card" type="button" onClick={startNewRoadmap}><span>＋</span><strong>Create New Roadmap</strong><small>Choose another career goal and build a new learning path.</small></button>
              {savedRoadmaps.length === 0 && <p className="emc-roadmaps-empty">Your saved roadmaps will appear here. Create your first roadmap to get started.</p>}
            </div>
          </section>

          <div className="emc-dashboard-content-grid emc-dashboard-quick-grid">
            <section className="emc-dashboard-card emc-dashboard-next-card">
              <div className="emc-dashboard-card-heading"><div><span className="emc-dashboard-kicker">QUICK ACCESS</span><h2>Keep building</h2></div><span className="emc-dashboard-card-symbol">✦</span></div>
              <button className="emc-dashboard-quick-link" type="button" onClick={() => { if (activeRoadmapId) setShowRoadmap(true); else if (savedRoadmaps[0]) openSavedRoadmap(savedRoadmaps[0]); else startNewRoadmap(); setActiveLearningSection("learn"); }}><span>▤</span><div><strong>Learn</strong><small>Explore lessons and resources</small></div><b>→</b></button>
              <button className="emc-dashboard-quick-link" type="button" onClick={() => { if (savedRoadmaps[0]) openSavedRoadmap(savedRoadmaps[0]); else startNewRoadmap(); setActiveLearningSection("practice"); }}><span>⌘</span><div><strong>Practice</strong><small>Build skills with hands-on work</small></div><b>→</b></button>
              <button className="emc-dashboard-quick-link" type="button" onClick={() => { if (savedRoadmaps[0]) openSavedRoadmap(savedRoadmaps[0]); else startNewRoadmap(); setActiveLearningSection("assignments"); }}><span>✓</span><div><strong>Assignments</strong><small>Test your understanding</small></div><b>→</b></button>
            </section>
          </div>

          <section className="emc-dashboard-bottom-note">
            <span>✧</span><div><strong>One step at a time.</strong><p>Your progress matters more than your speed. Keep showing up for your goals.</p></div>
          </section>
          {profileError && <p className="onboarding-error" role="alert">{profileError}</p>}
        </section>
      </main>
    );
  }

  return <main className="emc-page"><header className="emc-header"><a className="emc-logo" href="#" onClick={e => e.preventDefault()}>EMC</a><p className="brand-caption">ENVISION <span>·</span> MASTER <span>·</span> CONQUER</p></header><section className="hero"><p className="eyebrow">YOUR FUTURE, YOUR DIRECTION</p><h1>See your potential.<br />Master your skills.<br /><span>Conquer your goals.</span></h1><p className="hero-description">Build the future you envision. Choose your career path, build skills, and track your progress with EMC.</p><div className="auth-buttons"><button className="btn btn-gold" onClick={() => openModal("signup")}>Sign Up</button><button className="btn btn-outline" onClick={() => openModal("login")}>Login</button></div></section><section className="journey-stages"><article className="stage-card"><span className="stage-number">01</span><h2>Envision</h2><p>Set your goal</p></article><article className="stage-card"><span className="stage-number">02</span><h2>Master</h2><p>Build skills</p></article><article className="stage-card"><span className="stage-number">03</span><h2>Conquer</h2><p>Track growth</p></article></section><section className="journey-cta"><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h2>Start your journey</h2><p>Are you new to EMC or already a member?</p></section>{activeModal && <div className="modal-overlay" onClick={closeModal}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={closeModal} aria-label="Close popup" disabled={loading}>×</button><p className="eyebrow">ENVISION · MASTER · CONQUER</p><h2 id="modal-title">{activeModal === "signup" ? "Create your account" : "Welcome back"}</h2><p className="modal-description">{activeModal === "signup" ? "Your journey toward your goals starts here." : "Continue building the future you envision."}</p><form onSubmit={handleAuthSubmit}>{activeModal === "signup" && <label>Full name<input name="fullName" type="text" placeholder="Enter your full name" autoComplete="name" required /></label>}<label>Email address<input name="email" type="email" placeholder="Enter your email" autoComplete="email" required /></label><label>Password<input name="password" type="password" placeholder="Enter your password" autoComplete={activeModal === "signup" ? "new-password" : "current-password"} minLength={6} required /></label>{feedback && <p className="modal-description" role="status" aria-live="polite" style={{ color: feedbackType === "error" ? "#d9534f" : "#d5b46a" }}>{feedback}</p>}<button className="btn btn-gold modal-submit" type="submit" disabled={loading}>{loading ? "Please wait..." : activeModal === "signup" ? "Create Account" : "Login"}</button></form><p className="modal-switch">{activeModal === "signup" ? "Already a member?" : "New to EMC?"} <button className="text-button" disabled={loading} onClick={() => openModal(activeModal === "signup" ? "login" : "signup")}>{activeModal === "signup" ? "Login" : "Sign Up"}</button></p></section></div>}</main>;
}

function errorBlock(message) {
  return message ? <p className="onboarding-error" role="alert">{message}</p> : null;
}

export default App;
