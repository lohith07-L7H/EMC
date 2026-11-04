import { useMemo, useState } from "react";

// EMC Practice question library. Add new questions to this array as the library grows.
const LANGUAGES = [
  { name: "C", id: "c", type: "code" },
  { name: "C++", id: "cpp", type: "code" },
  { name: "Python", id: "python", type: "code" },
  { name: "Java", id: "java", type: "code" },
  { name: "JavaScript", id: "javascript", type: "code" },
  { name: "TypeScript", id: "typescript", type: "code" },
  { name: "C#", id: "csharp", type: "code" },
  { name: "Go", id: "go", type: "code" },
  { name: "Rust", id: "rust", type: "code" },
  { name: "Kotlin", id: "kotlin", type: "code" },
  { name: "Swift", id: "swift", type: "code" },
  { name: "PHP", id: "php", type: "code" },
  { name: "Ruby", id: "ruby", type: "code" },
  { name: "Dart", id: "dart", type: "code" },
  { name: "R", id: "r", type: "code" },
  { name: "Scala", id: "scala", type: "code" },
  { name: "Perl", id: "perl", type: "code" },
  { name: "Lua", id: "lua", type: "code" },
  { name: "Bash", id: "bash", type: "code" },
  { name: "Assembly", id: "assembly", type: "code" },
  { name: "Haskell", id: "haskell", type: "code" },
  { name: "Julia", id: "julia", type: "code" },
  { name: "HTML", id: "html", type: "web" },
  { name: "SQL (MySQL)", id: "mysql", type: "sql" },
  { name: "SQLite", id: "sqlite", type: "sql" },
  { name: "PostgreSQL", id: "postgresql", type: "sql" },
  { name: "MongoDB", id: "mongodb", type: "mongo" },
];

// General programming problems can be solved in any selected programming language.
const CODE_QUESTIONS = [
  ["basics", "Print Hello World", "Easy", 5, "Print the exact text Hello, World!", "No input", "Hello, World!", "Use your language's standard output function."],
  ["basics", "Add Two Integers", "Easy", 5, "Read two integers and print their sum.", "12 8", "20", "Read both values, add them, and print the result."],
  ["basics", "Swap Two Numbers", "Easy", 5, "Read two integers and print them in swapped order.", "4 9", "9 4", "Use a temporary variable or a language-supported swap."],
  ["basics", "Simple Interest", "Easy", 5, "Given principal, annual rate and time, calculate simple interest: P × R × T / 100.", "1000 5 2", "100", "Use floating-point arithmetic if needed."],
  ["conditions", "Even or Odd", "Easy", 5, "Read an integer and print Even if divisible by 2, otherwise Odd.", "17", "Odd", "Check the remainder after division by 2."],
  ["conditions", "Largest of Three", "Easy", 10, "Read three integers and print the largest.", "12 45 23", "45", "Compare all three values."],
  ["conditions", "Leap Year", "Medium", 10, "Determine whether a year is a leap year. A leap year is divisible by 400, or divisible by 4 but not 100.", "2000", "Leap Year", "Implement the complete divisibility rule."],
  ["conditions", "Grade Calculator", "Easy", 10, "Read marks from 0 to 100. Print A for 90+, B for 80–89, C for 70–79, D for 60–69, otherwise F.", "84", "B", "Use an if/else-if ladder."],
  ["loops", "Sum from 1 to N", "Easy", 5, "Read N and calculate 1 + 2 + ... + N.", "5", "15", "Use a loop or the arithmetic-series formula."],
  ["loops", "Factorial", "Easy", 10, "Read a non-negative integer N and print N factorial. Define 0! as 1.", "5", "120", "Start the product at 1 and multiply from 1 through N."],
  ["loops", "Multiplication Table", "Easy", 5, "Read N and print its multiplication table from 1 to 10, one result per line as N x i = result.", "3", "3 x 1 = 3 ... 3 x 10 = 30", "Use a loop from 1 through 10."],
  ["loops", "Reverse an Integer", "Medium", 10, "Read a positive integer and print its digits in reverse order.", "4821", "1284", "Repeatedly take the last digit using remainder and remove it using integer division."],
  ["number", "Prime Number Check", "Medium", 10, "Read an integer and print Prime or Not Prime. Numbers below 2 are not prime.", "29", "Prime", "Check divisors from 2 up to the square root of N."],
  ["number", "Fibonacci Series", "Medium", 10, "Read N and print the first N Fibonacci numbers, starting with 0 and 1.", "7", "0 1 1 2 3 5 8", "Keep the previous two terms and update them each iteration."],
  ["number", "GCD of Two Numbers", "Medium", 10, "Read two non-negative integers and print their greatest common divisor.", "24 18", "6", "Use the Euclidean algorithm."],
  ["number", "Armstrong Number", "Medium", 15, "Check whether a three-digit number equals the sum of the cubes of its digits.", "153", "Armstrong", "Extract each digit and add its cube."],
  ["patterns", "Right-Angled Star Pattern", "Easy", 10, "Read N and print N rows. Row i must contain i star characters.", "4", "* / ** / *** / ****", "Use a nested loop."],
  ["arrays", "Largest Array Element", "Easy", 10, "Read N followed by N integers and print the largest value.", "5; 4 9 2 15 7", "15", "Initialize the maximum with the first element."],
  ["arrays", "Second Largest Distinct Element", "Medium", 15, "Read N integers and print the second-largest distinct value. If it does not exist, print -1.", "6; 4 9 9 2 7 5", "7", "Track the largest and second-largest distinct values."],
  ["arrays", "Reverse an Array", "Easy", 10, "Read N integers and print them in reverse order.", "5; 1 2 3 4 5", "5 4 3 2 1", "Traverse from the last index to the first."],
  ["arrays", "Linear Search", "Easy", 10, "Read N integers and a target. Print the zero-based index of its first occurrence, or -1 if absent.", "5; 3 8 2 8 1; target 8", "1", "Scan from left to right and stop at the first match."],
  ["arrays", "Remove Duplicates", "Medium", 15, "Given N integers, print the distinct values in their original order.", "7; 1 2 1 3 2 4 3", "1 2 3 4", "Keep a value only if it has not appeared earlier."],
  ["strings", "Count Vowels", "Easy", 10, "Read a line and count the vowels a, e, i, o, u without considering case.", "Education", "5", "Convert each character to lowercase before checking."],
  ["strings", "Palindrome String", "Easy", 10, "Read a word and determine whether it reads the same forwards and backwards. Ignore letter case.", "Level", "Palindrome", "Compare characters from both ends."],
  ["strings", "Character Frequency", "Medium", 10, "Read a string and a character. Print how many times the character occurs.", "banana; a", "3", "Visit every character and increment a counter on a match."],
  ["strings", "Reverse a String", "Easy", 10, "Read a word and print its characters in reverse order.", "EMC", "CME", "Traverse backwards or use a two-pointer approach."],
  ["functions", "Power Using a Function", "Easy", 10, "Write a function that calculates a raised to the power b for non-negative integer b.", "2 5", "32", "Multiply a by itself b times; return 1 when b is zero."],
  ["functions", "Recursive Factorial", "Medium", 15, "Implement factorial using recursion. Handle 0! = 1.", "6", "720", "Use a base case for n <= 1."],
  ["sorting", "Bubble Sort", "Medium", 15, "Read N integers, sort them in ascending order using bubble sort, and print the result.", "5; 5 1 4 2 8", "1 2 4 5 8", "Compare adjacent elements and swap when out of order."],
  ["sorting", "Merge Two Sorted Arrays", "Medium", 15, "Given two sorted arrays, merge them into one sorted array.", "3; 1 4 7; 3; 2 3 8", "1 2 3 4 7 8", "Use two indices and repeatedly select the smaller current value."],
  ["searching", "Binary Search", "Medium", 15, "Given a sorted array and a target, return its zero-based index or -1.", "5; 1 3 5 7 9; target 7", "3", "Use low, high and mid; discard half the search range each step."],
  ["matrices", "Matrix Addition", "Easy", 10, "Read two matrices of the same dimensions and print their sum.", "2x2; 1 2 3 4; 5 6 7 8", "6 8 / 10 12", "Add elements at matching row and column positions."],
  ["matrices", "Transpose a Matrix", "Medium", 10, "Read an R x C matrix and print its transpose.", "2x3; 1 2 3 / 4 5 6", "1 4 / 2 5 / 3 6", "Swap the row and column indices when printing."],
  ["recursion", "Sum of Digits Recursively", "Medium", 10, "Find the sum of digits of a non-negative integer using recursion.", "527", "14", "Base case: a number below 10 returns itself."],
  ["data-structures", "Stack Operations", "Medium", 15, "Implement a stack supporting push, pop and display. Print -1 when pop is attempted on an empty stack.", "push 4; push 7; pop; display", "4", "Use an array or list and maintain a top index."],
  ["data-structures", "Balanced Parentheses", "Medium", 15, "Given a string containing (), [] and {}, determine whether brackets are balanced.", "{[()]}", "Balanced", "Use a stack; every closing bracket must match the latest opening bracket."],
  ["data-structures", "Queue Using an Array", "Medium", 15, "Implement enqueue, dequeue and front operations for a queue.", "enqueue 5; enqueue 8; dequeue; front", "8", "Maintain front and rear positions; handle an empty queue."],
  ["algorithms", "Two Sum", "Medium", 15, "Given an integer array and target, find two distinct elements whose sum equals target. Print their indices; assume one solution exists.", "4; 2 7 11 15; target 9", "0 1", "A nested-loop solution is acceptable; a hash map is faster."],
  ["algorithms", "Maximum Subarray Sum", "Hard", 20, "Find the maximum sum of a non-empty contiguous subarray.", "9; -2 1 -3 4 -1 2 1 -5 4", "6", "Try Kadane's algorithm: extend the current subarray or start a new one."],
  ["algorithms", "Climbing Stairs", "Medium", 15, "You can climb 1 or 2 steps at a time. Find the number of distinct ways to reach step N.", "5", "8", "The answer follows a Fibonacci-style recurrence."],
  ["algorithms", "First Non-Repeating Character", "Hard", 20, "Given a string, print the first character that occurs exactly once. Print -1 if none exists.", "swiss", "w", "Count frequencies, then scan the string again."],
];

const HTML_QUESTIONS = [
  ["html-basics", "Build a Personal Profile", "Easy", 10, "Create a semantic HTML page with your name as an h1, a short bio, an image with alt text, and a list of three interests.", "No input", "A webpage showing the profile and interests.", "Use h1, p, img, ul and li."],
  ["html-basics", "Add Page Navigation", "Easy", 10, "Create a page with a header and navigation links to Home, About and Contact sections on the same page.", "No input", "Each link jumps to its matching section.", "Use href values that match section id attributes."],
  ["html-forms", "Student Registration Form", "Medium", 15, "Create a form with name, email, password, date of birth, gender radio buttons and a submit button. Add labels and required validation.", "No input", "A usable student registration form.", "Use label, input, fieldset and required."],
  ["html-forms", "Accessible Login Form", "Medium", 15, "Create an accessible login form with email and password fields, labels, autocomplete attributes and a submit button.", "No input", "A login form with correctly labelled fields.", "Connect each label's for attribute to an input id."],
  ["html-tables", "Student Marks Table", "Easy", 10, "Create a table with columns Roll No, Name and Marks. Add at least three student rows and a caption.", "No input", "A readable table with a header and three rows.", "Use caption, thead, tbody, tr, th and td."],
  ["html-media", "Embed a Video", "Medium", 10, "Create a page containing a video element with controls and fallback text. Use a sample media URL if available.", "No input", "A video player with controls.", "Use the video element and controls attribute."],
  ["html-semantic", "Semantic Blog Article", "Medium", 15, "Build a blog page using header, nav, main, article, section, aside and footer elements appropriately.", "No input", "A structured blog layout.", "Choose elements by meaning, not just their default appearance."],
  ["html-accessibility", "Accessible Image Gallery", "Medium", 15, "Create a gallery of three images. Each image must have useful alt text, and each image should be inside a figure with a figcaption.", "No input", "A gallery with three captioned images.", "Use figure, img, alt and figcaption."],
];

const SQL_QUESTIONS = [
  ["sql-basics", "Select All Records", "Easy", 5, "Given Employees(employee_id, name, department, salary), write a query to display every column for every employee.", "Employees table", "All rows and columns", "Use SELECT with an asterisk."],
  ["sql-basics", "Filter by Salary", "Easy", 5, "Display employee names and salaries for employees earning more than 50000.", "Employees(employee_id, name, salary)", "Rows with salary > 50000", "Use WHERE with a comparison operator."],
  ["sql-basics", "Sort Employees", "Easy", 5, "Display all employees ordered by salary from highest to lowest.", "Employees table", "Rows sorted by descending salary", "Use ORDER BY ... DESC."],
  ["sql-aggregate", "Count Employees", "Easy", 5, "Write a query that returns the total number of employees.", "Employees table", "A single count value", "Use COUNT(*)."],
  ["sql-aggregate", "Average Department Salary", "Medium", 10, "Show each department and its average salary. Group results by department.", "Employees(department, salary)", "Department and average salary", "Use AVG() with GROUP BY."],
  ["sql-joins", "Employees with Department Names", "Medium", 10, "Given Employees(employee_id, name, department_id) and Departments(department_id, department_name), display each employee name with the department name.", "Two related tables", "Employee name and department name", "Join on department_id."],
  ["sql-joins", "Departments Without Employees", "Hard", 15, "Display departments that currently have no employees.", "Departments and Employees tables", "Departments with no matching employee", "Use LEFT JOIN and filter unmatched employee rows."],
  ["sql-subqueries", "Above Average Salary", "Medium", 15, "Display employees whose salary is greater than the overall average salary.", "Employees(name, salary)", "Employees above average", "Compare salary with a scalar AVG subquery."],
  ["sql-subqueries", "Second Highest Salary", "Hard", 15, "Find the second-highest distinct salary in the Employees table.", "Employees(salary)", "Second-highest distinct salary", "Consider DISTINCT with ORDER BY and LIMIT/OFFSET, or a subquery."],
  ["sql-modification", "Update a Department", "Medium", 10, "Write an UPDATE statement to change the department of employee_id 12 to 'Engineering'.", "Employees(employee_id, department)", "Employee 12 updated", "Use UPDATE with a WHERE clause."],
];

const MONGO_QUESTIONS = [
  ["mongo-basics", "Find All Documents", "Easy", 5, "Given a collection named students, write a MongoDB query to return all documents.", "students collection", "All documents", "Use find() with an empty filter object."],
  ["mongo-basics", "Find by Department", "Easy", 10, "Find all student documents where department is 'AIML'.", "students documents with department field", "Matching AIML documents", "Pass a filter object to find()."],
  ["mongo-filter", "Students Above 80 Marks", "Easy", 10, "Find students whose marks are greater than 80.", "students(name, marks)", "Documents with marks > 80", "Use the $gt comparison operator."],
  ["mongo-filter", "Sort by Marks", "Medium", 10, "Return students sorted by marks from highest to lowest.", "students collection", "Documents sorted descending", "Chain sort() with a value of -1 for marks."],
  ["mongo-aggregate", "Count Students by Department", "Medium", 15, "Use an aggregation pipeline to count students in each department.", "students(department)", "Department and count", "Use $group with _id and $sum."],
  ["mongo-update", "Update Student Email", "Medium", 10, "Update the email field for the student whose rollNo is 101.", "students(rollNo, email)", "One matching document updated", "Use updateOne() with $set."],
];

const TOPIC_LABELS = {
  basics: "Basics", conditions: "Conditions", loops: "Loops", number: "Number Problems",
  patterns: "Patterns", arrays: "Arrays", strings: "Strings", functions: "Functions",
  sorting: "Sorting", searching: "Searching", matrices: "Matrices", recursion: "Recursion",
  "data-structures": "Data Structures", algorithms: "Algorithms", "html-basics": "HTML Basics",
  "html-forms": "Forms", "html-tables": "Tables", "html-media": "Media",
  "html-semantic": "Semantic HTML", "html-accessibility": "Accessibility", "sql-basics": "SQL Basics",
  "sql-aggregate": "Aggregate Functions", "sql-joins": "Joins", "sql-subqueries": "Subqueries",
  "sql-modification": "Insert / Update / Delete", "mongo-basics": "MongoDB Basics",
  "mongo-filter": "Filtering and Sorting", "mongo-aggregate": "Aggregation", "mongo-update": "Updates",
};

const toQuestion = (row, index, prefix) => ({
  id: `${prefix}-${index + 1}`,
  topic: row[0], title: row[1], difficulty: row[2], marks: row[3],
  description: row[4], input: row[5], output: row[6], hint: row[7],
});

const QUESTIONS = {
  code: CODE_QUESTIONS.map((q, i) => toQuestion(q, i, "code")),
  web: HTML_QUESTIONS.map((q, i) => toQuestion(q, i, "html")),
  sql: SQL_QUESTIONS.map((q, i) => toQuestion(q, i, "sql")),
  mongo: MONGO_QUESTIONS.map((q, i) => toQuestion(q, i, "mongo")),
};

const safeRead = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};

export default function PracticeWorkspace({ topic: learningTopic }) {
  const [language, setLanguage] = useState("C");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [questionId, setQuestionId] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => safeRead("emc-practice-bookmarks-v1"));
  const [solved, setSolved] = useState(() => safeRead("emc-practice-solved-v1"));
  const pageSize = 8;
  const selectedLanguage = LANGUAGES.find((item) => item.name === language) || LANGUAGES[0];
  const sourceQuestions = QUESTIONS[selectedLanguage.type] || QUESTIONS.code;

  const filtered = useMemo(() => sourceQuestions.filter((q) => {
    const matchesTopic = topic === "all" || q.topic === topic;
    const matchesDifficulty = difficulty === "All" || q.difficulty === difficulty;
    const matchesSearch = `${q.title} ${q.description} ${TOPIC_LABELS[q.topic] || q.topic}`.toLowerCase().includes(search.toLowerCase().trim());
    const matchesBookmark = !showBookmarksOnly || bookmarks.includes(q.id);
    return matchesTopic && matchesDifficulty && matchesSearch && matchesBookmark;
  }), [sourceQuestions, topic, difficulty, search, showBookmarksOnly, bookmarks]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleQuestions = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedQuestion = filtered.find((q) => q.id === questionId) || visibleQuestions[0] || filtered[0] || null;
  const topicOptions = [...new Set(sourceQuestions.map((q) => q.topic))];
  const solvedCount = sourceQuestions.filter((q) => solved.includes(q.id)).length;

  const changeLanguage = (name) => {
    setLanguage(name); setTopic("all"); setDifficulty("All"); setSearch("");
    setPage(1); setQuestionId(null); setShowHint(false); setShowBookmarksOnly(false);
  };
  const toggleSaved = (id, list, setter, storageKey) => {
    const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
    setter(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
  };
  const pickQuestion = (q) => { setQuestionId(q.id); setShowHint(false); };
  const updateFilter = (setter, value) => { setter(value); setPage(1); setQuestionId(null); };

  return (
    <section style={{ marginTop: 24, width: "100%", color: "inherit" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h3 style={{ margin: "0 0 6px" }}>EMC Coding Practice</h3>
            <p style={{ margin: 0, opacity: 0.72 }}>Choose a language, explore problems and practise in the built-in compiler.</p>
          </div>
          <div style={statStyle}><strong>{solvedCount}</strong><span> solved on this device</span></div>
        </div>
      </div>

      <div style={filterGridStyle}>
        <label style={labelStyle}>Programming language
          <select value={language} onChange={(e) => changeLanguage(e.target.value)} style={selectStyle}>
            {LANGUAGES.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Topic
          <select value={topic} onChange={(e) => updateFilter(setTopic, e.target.value)} style={selectStyle}>
            <option value="all">All topics</option>
            {topicOptions.map((key) => <option key={key} value={key}>{TOPIC_LABELS[key] || key}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Difficulty
          <select value={difficulty} onChange={(e) => updateFilter(setDifficulty, e.target.value)} style={selectStyle}>
            <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "14px 0 18px" }}>
        <input value={search} onChange={(e) => updateFilter(setSearch, e.target.value)} placeholder="Search questions or topics..." style={{ ...selectStyle, flex: "1 1 240px" }} />
        <button type="button" onClick={() => { setShowBookmarksOnly((v) => !v); setPage(1); }} style={showBookmarksOnly ? activeButtonStyle : secondaryButtonStyle}>
          {showBookmarksOnly ? "★ Showing saved" : "☆ Saved questions"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <strong>{filtered.length} questions available</strong>
        <span style={{ fontSize: 12, opacity: 0.65 }}>Question library is shared by language category; general coding problems can be solved in any selected language.</span>
      </div>

      <div style={questionGridStyle}>
        {visibleQuestions.map((q, index) => (
          <button type="button" key={q.id} onClick={() => pickQuestion(q)} style={questionCardStyle(selectedQuestion?.id === q.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 13 }}>#{(safePage - 1) * pageSize + index + 1}</strong>
              <span style={{ fontSize: 12 }}>{bookmarks.includes(q.id) ? "★" : "☆"}</span>
            </div>
            <div style={{ fontWeight: 650, margin: "8px 0", lineHeight: 1.35 }}>{q.title}</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>{q.difficulty} · {q.marks} marks</div>
            {solved.includes(q.id) && <div style={{ color: "#38a169", fontSize: 12, marginTop: 7 }}>✓ Solved</div>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div style={emptyStyle}>No questions match these filters. Try another topic, difficulty or search term.</div>}

      {filtered.length > 0 && <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, margin: "18px 0 24px" }}>
        <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={secondaryButtonStyle}>Previous</button>
        <span style={{ fontSize: 13 }}>Page {safePage} of {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={secondaryButtonStyle}>Next</button>
      </div>}

      {selectedQuestion && <div style={problemPanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{language} / {TOPIC_LABELS[selectedQuestion.topic] || selectedQuestion.topic}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={tagStyle}>{selectedQuestion.difficulty}</span><span style={tagStyle}>{selectedQuestion.marks} marks</span>
          </div>
        </div>
        <h3 style={{ margin: "14px 0 8px" }}>{selectedQuestion.title}</h3>
        <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selectedQuestion.description}</p>
        <div style={exampleGridStyle}>
          <div style={exampleStyle}><strong>Sample Input</strong><pre style={preStyle}>{selectedQuestion.input}</pre></div>
          <div style={exampleStyle}><strong>Expected Output</strong><pre style={preStyle}>{selectedQuestion.output}</pre></div>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
          <button type="button" onClick={() => setShowHint((v) => !v)} style={secondaryButtonStyle}>{showHint ? "Hide hint" : "Show hint"}</button>
          <button type="button" onClick={() => toggleSaved(selectedQuestion.id, bookmarks, setBookmarks, "emc-practice-bookmarks-v1")} style={secondaryButtonStyle}>{bookmarks.includes(selectedQuestion.id) ? "★ Remove saved" : "☆ Save question"}</button>
          <button type="button" onClick={() => toggleSaved(selectedQuestion.id, solved, setSolved, "emc-practice-solved-v1")} style={activeButtonStyle}>{solved.includes(selectedQuestion.id) ? "✓ Mark as unsolved" : "✓ Mark as solved"}</button>
        </div>
        {showHint && <div style={hintStyle}><strong>Hint:</strong> {selectedQuestion.hint}</div>}
      </div>}

      <div style={{ margin: "22px 0 12px" }}>
        <h3 style={{ margin: "0 0 6px" }}>Compiler</h3>
        <p style={{ margin: 0, opacity: 0.7 }}>Write, run and test your solution. The compiler opens in the selected language.</p>
      </div>
      <div style={compilerFrameStyle}>
        <iframe key={selectedLanguage.id} title={`${language} online compiler`} src={`https://onecompiler.com/embed/${selectedLanguage.id}?theme=dark`} width="100%" height="620" loading="lazy" allow="clipboard-read; clipboard-write" style={{ display: "block", border: 0, background: "#111" }} />
      </div>
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 10 }}>Compiler provided by OneCompiler. EMC displays sample input and expected output; students should test their own solutions.</p>
      <p style={{ fontSize: 12, opacity: 0.65 }}>Progress and saved questions currently stay in this browser on this device. They are not yet synced between student accounts.</p>
      {learningTopic && <p style={{ fontSize: 12, opacity: 0.6 }}>Learning topic: {learningTopic}</p>}
    </section>
  );
}

const selectStyle = { width: "100%", marginTop: 7, padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(196,154,53,.5)", background: "#171717", color: "#fff", minWidth: 0 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, minWidth: 0 };
const filterGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const questionGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 };
const questionCardStyle = (active) => ({ textAlign: "left", padding: 14, minHeight: 112, borderRadius: 10, border: active ? "1px solid #c49a35" : "1px solid rgba(128,128,128,.3)", background: active ? "rgba(196,154,53,.12)" : "transparent", color: "inherit", cursor: "pointer" });
const secondaryButtonStyle = { padding: "10px 13px", borderRadius: 8, border: "1px solid rgba(196,154,53,.5)", background: "transparent", color: "inherit", cursor: "pointer" };
const activeButtonStyle = { ...secondaryButtonStyle, background: "rgba(196,154,53,.16)", border: "1px solid #c49a35" };
const statStyle = { display: "flex", gap: 5, alignItems: "baseline", padding: "9px 12px", borderRadius: 9, background: "rgba(196,154,53,.1)", fontSize: 12 };
const tagStyle = { fontSize: 12, padding: "5px 9px", borderRadius: 20, background: "rgba(128,128,128,.14)" };
const problemPanelStyle = { padding: 20, border: "1px solid rgba(196,154,53,.35)", borderRadius: 12, marginTop: 8 };
const exampleGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 };
const exampleStyle = { padding: 13, borderRadius: 8, background: "rgba(128,128,128,.08)", minWidth: 0 };
const preStyle = { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "monospace", marginBottom: 0, fontSize: 13 };
const hintStyle = { marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(196,154,53,.1)", lineHeight: 1.6 };
const emptyStyle = { padding: 20, textAlign: "center", borderRadius: 10, background: "rgba(128,128,128,.08)", opacity: 0.8 };
const compilerFrameStyle = { border: "1px solid rgba(212,175,55,.35)", borderRadius: 14, overflow: "hidden", background: "#111" };
