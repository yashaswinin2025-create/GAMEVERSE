
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-before-deployment";

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
}));

const db = new Database("gameverse.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// DATABASE TABLES

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  launch_url TEXT,
  browser_supported INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  FOREIGN KEY(app_id) REFERENCES apps(id)
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  app_id INTEGER NOT NULL,
  question_ids TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(app_id) REFERENCES apps(id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  app_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(app_id) REFERENCES apps(id)
);

CREATE TABLE IF NOT EXISTS unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  app_id INTEGER NOT NULL,
  unlocked_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(app_id) REFERENCES apps(id)
);
`);

// SAMPLE CATALOGUE

const seedApps = [
  ["Free Fire", "free-fire", "Games", "Battle royale game", null, null, 0],
  ["PUBG Battlegrounds", "pubg", "Games", "Battle royale game", null, null, 0],
  ["Candy Crush Saga", "candy-crush", "Games", "Puzzle game", null, null, 0],
  ["Subway Surfers", "subway-surfers", "Games", "Endless runner game", null, null, 0],
  ["JioStar", "jiostar", "Entertainment", "Streaming service", null, null, 0],
  ["ZEE5", "zee5", "Entertainment", "Streaming service", null, null, 0]
];

const insertApp = db.prepare(`
  INSERT OR IGNORE INTO apps
  (name, slug, category, description, icon_url, launch_url, browser_supported)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const item of seedApps) {
  insertApp.run(...item);
}

// AUTHENTICATION

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password || password.length < 8) {
      return res.status(400).json({
        error: "Enter username, email and a password of at least 8 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `).run(username.trim(), email.trim().toLowerCase(), hashedPassword);

    res.status(201).json({
      message: "Account created",
      userId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Email already registered" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(String(email || "").trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      username: user.username
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// APP CATALOGUE

app.get("/api/apps", (req, res) => {
  const { category, search } = req.query;

  let sql = "SELECT * FROM apps WHERE 1=1";
  const params = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  if (search) {
    sql += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  sql += " ORDER BY name";

  const apps = db.prepare(sql).all(...params);
  res.json(apps);
});

app.get("/api/apps/:slug", (req, res) => {
  const item = db.prepare(
    "SELECT * FROM apps WHERE slug = ?"
  ).get(req.params.slug);

  if (!item) {
    return res.status(404).json({ error: "App not found" });
  }

  res.json(item);
});

// QUIZ QUESTION BANK

const questionBank = [
  {
    q: "What does CPU stand for?",
    a: "Central Processing Unit",
    b: "Computer Personal Unit",
    c: "Central Program Utility",
    d: "Control Processing User",
    correct: "a",
    difficulty: "easy"
  },
  {
    q: "Which device is commonly used to move a pointer?",
    a: "Printer",
    b: "Mouse",
    c: "Speaker",
    d: "Scanner",
    correct: "b",
    difficulty: "easy"
  },
  {
    q: "Which language is commonly used to structure web pages?",
    a: "HTML",
    b: "SQL",
    c: "C",
    d: "Python",
    correct: "a",
    difficulty: "medium"
  },
  {
    q: "What does RAM primarily provide?",
    a: "Permanent storage",
    b: "Temporary working memory",
    c: "Internet connection",
    d: "Power supply",
    correct: "b",
    difficulty: "medium"
  },
  {
    q: "Which data structure follows LIFO?",
    a: "Queue",
    b: "Tree",
    c: "Stack",
    d: "Graph",
    correct: "c",
    difficulty: "hard"
  }
];

// Give each catalogue app its own question bank.
// These are starter questions; app-specific question banks
// will be added during the next development stage.

const insertQuestion = db.prepare(`
  INSERT INTO questions
  (app_id, question, option_a, option_b, option_c, option_d,
   correct_answer, difficulty)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const existingQuestions = db.prepare(
  "SELECT COUNT(*) AS total FROM questions"
).get().total;

if (existingQuestions === 0) {
  const apps = db.prepare("SELECT id FROM apps").all();

  for (const item of apps) {
    for (const q of questionBank) {
      insertQuestion.run(
        item.id, q.q, q.a, q.b, q.c, q.d,
        q.correct, q.difficulty
      );
    }
  }
}

// START A QUIZ

app.post("/api/apps/:slug/quiz", authenticate, (req, res) => {
  const item = db.prepare(
    "SELECT * FROM apps WHERE slug = ?"
  ).get(req.params.slug);

  if (!item) {
    return res.status(404).json({ error: "App not found" });
  }

  const now = Date.now();

  const activeUnlock = db.prepare(`
    SELECT * FROM unlocks
    WHERE user_id = ? AND app_id = ? AND expires_at > ?
    ORDER BY expires_at DESC LIMIT 1
  `).get(req.user.id, item.id, now);

  if (activeUnlock) {
    return res.status(409).json({
      error: "This app is already unlocked",
      expiresAt: activeUnlock.expires_at
    });
  }

  const attempts = db.prepare(`
    SELECT COUNT(*) AS total FROM quiz_attempts
    WHERE user_id = ? AND app_id = ?
  `).get(req.user.id, item.id).total;

  if (attempts >= 3) {
    return res.status(403).json({
      error: "Maximum 3 attempts reached for this app"
    });
  }

  const easy = db.prepare(`
    SELECT * FROM questions
    WHERE app_id = ? AND difficulty = 'easy'
    ORDER BY RANDOM() LIMIT 2
  `).all(item.id);

  const medium = db.prepare(`
    SELECT * FROM questions
    WHERE app_id = ? AND difficulty = 'medium'
    ORDER BY RANDOM() LIMIT 2
  `).all(item.id);

  const hard = db.prepare(`
    SELECT * FROM questions
    WHERE app_id = ? AND difficulty = 'hard'
    ORDER BY RANDOM() LIMIT 1
  `).all(item.id);

  const selected = [...easy, ...medium, ...hard];

  if (selected.length !== 5) {
    return res.status(500).json({
      error: "Question bank is incomplete"
    });
  }

  const sessionId = require("crypto").randomUUID();

  db.prepare(`
    INSERT INTO quiz_sessions
    (id, user_id, app_id, question_ids, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sessionId,
    req.user.id,
    item.id,
    JSON.stringify(selected.map(q => q.id)),
    now + 15 * 60 * 1000
  );

  res.json({
    sessionId,
    app: item.name,
    questions: selected.map(q => ({
      id: q.id,
      question: q.question,
      options: {
        a: q.option_a,
        b: q.option_b,
        c: q.option_c,
        d: q.option_d
      },
      difficulty: q.difficulty
    })),
    attemptsUsed: attempts,
    attemptsRemaining: 3 - attempts,
    passingScore: 3
  });
});

// SUBMIT QUIZ

app.post("/api/apps/:slug/submit", authenticate, (req, res) => {
  const { sessionId, answers } = req.body;

  const item = db.prepare(
    "SELECT * FROM apps WHERE slug = ?"
  ).get(req.params.slug);

  if (!item) {
    return res.status(404).json({ error: "App not found" });
  }

  const session = db.prepare(`
    SELECT * FROM quiz_sessions
    WHERE id = ? AND user_id = ? AND app_id = ?
  `).get(sessionId, req.user.id, item.id);

  if (!session || session.expires_at < Date.now()) {
    return res.status(400).json({
      error: "Quiz session is invalid or expired"
    });
  }

  const questionIds = JSON.parse(session.question_ids);

  if (!Array.isArray(answers) || answers.length !== 5) {
    return res.status(400).json({
      error: "Submit exactly 5 answers"
    });
  }

  const submittedIds = answers.map(a => a.questionId);

  if (
    new Set(submittedIds).size !== 5 ||
    !questionIds.every(id => submittedIds.includes(id))
  ) {
    return res.status(400).json({
      error: "Invalid question answers"
    });
  }

  const questions = db.prepare(`
    SELECT id, correct_answer FROM questions
    WHERE app_id = ?
  `).all(item.id);

  const answerMap = new Map(
    questions.map(q => [q.id, q.correct_answer])
  );

  let score = 0;

  for (const answer of answers) {
    if (
      typeof answer.answer === "string" &&
      answer.answer.toLowerCase() === answerMap.get(answer.questionId)
    ) {
      score++;
    }
  }

  const passed = score >= 3 ? 1 : 0;
  const now = Date.now();

  const recordAttempt = db.transaction(() => {
    const attempts = db.prepare(`
      SELECT COUNT(*) AS total FROM quiz_attempts
      WHERE user_id = ? AND app_id = ?
    `).get(req.user.id, item.id).total;

    if (attempts >= 3) {
      throw new Error("ATTEMPTS_LIMIT");
    }

    db.prepare(`
      INSERT INTO quiz_attempts
      (user_id, app_id, score, passed, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, item.id, score, passed, now);

    db.prepare("DELETE FROM quiz_sessions WHERE id = ?")
      .run(sessionId);

    if (passed) {
      db.prepare(`
        INSERT INTO unlocks
        (user_id, app_id, unlocked_at, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(
        req.user.id,
        item.id,
        now,
        now + 24 * 60 * 60 * 1000
      );
    }

    return attempts + 1;
  });

  try {
    const attemptsUsed = recordAttempt();

    res.json({
      score,
      passed: Boolean(passed),
      attemptsUsed,
      attemptsRemaining: 3 - attemptsUsed,
      unlockHours: passed ? 24 : 0,
      message: passed
        ? `${item.name} unlocked for 24 hours!`
        : "Not passed. You can try again if attempts remain."
    });
  } catch (error) {
    if (error.message === "ATTEMPTS_LIMIT") {
      return res.status(403).json({
        error: "Maximum attempts reached"
      });
    }

    res.status(500).json({ error: "Could not submit quiz" });
  }
});

// CHECK INDIVIDUAL APP ACCESS

app.get("/api/apps/:slug/access", authenticate, (req, res) => {
  const item = db.prepare(
    "SELECT * FROM apps WHERE slug = ?"
  ).get(req.params.slug);

  if (!item) {
    return res.status(404).json({ error: "App not found" });
  }

  const now = Date.now();

  const unlock = db.prepare(`
    SELECT * FROM unlocks
    WHERE user_id = ? AND app_id = ? AND expires_at > ?
    ORDER BY expires_at DESC LIMIT 1
  `).get(req.user.id, item.id, now);

  res.json({
    app: item.name,
    unlocked: Boolean(unlock),
    expiresAt: unlock ? unlock.expires_at : null,
    remainingMilliseconds: unlock
      ? Math.max(0, unlock.expires_at - now)
      : 0,
    launchUrl: unlock && item.browser_supported
      ? item.launch_url
      : null
  });
});

// SERVER STATUS

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    project: "GAMEVERSE 2.0",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`GAMEVERSE 2.0 backend running on http://localhost:${PORT}`);
});
