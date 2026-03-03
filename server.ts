import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Visitor count persistence
const VISITOR_COUNT_FILE = path.join(__dirname, "data", "visitor_count.json");
let visitorCount = 0;

try {
  if (fs.existsSync(VISITOR_COUNT_FILE)) {
    const data = fs.readFileSync(VISITOR_COUNT_FILE, "utf-8");
    visitorCount = JSON.parse(data).count || 0;
  } else {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    fs.writeFileSync(VISITOR_COUNT_FILE, JSON.stringify({ count: 0 }));
  }
} catch (err) {
  console.error("Error initializing visitor count:", err);
}

function saveVisitorCount() {
  try {
    fs.writeFileSync(VISITOR_COUNT_FILE, JSON.stringify({ count: visitorCount }));
  } catch (err) {
    console.error("Error saving visitor count:", err);
  }
}

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Visitor count API
app.get("/api/visitor-count", (req, res) => {
  res.json({ count: visitorCount });
});

app.post("/api/visitor-count/increment", (req, res) => {
  visitorCount++;
  saveVisitorCount();
  res.json({ count: visitorCount });
});

// Direct API route for submissions - MUST BE BEFORE STATIC/CATCH-ALL
app.get("/api/submissions", (req, res) => {
  const filePath = path.join(__dirname, "data", "submissions.json");
  console.log(`Attempting to serve data from: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ error: "Could not read submissions data", details: err.message });
    } else {
      console.log("Data served successfully");
    }
  });
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Fallback to index.html for any other routes (SPA-like behavior)
app.get("*", (req, res) => {
  // If it's an API call that wasn't caught, return 404
  if (req.url.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  // Otherwise serve index.html
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server running at http://0.0.0.0:${PORT}`);
});
