import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Explicitly serve the data directory to be safe
app.use("/data", express.static(path.join(__dirname, "data")));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test route to verify data serving
app.get("/api/test-data", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "submissions.json"));
});

// Direct API route for submissions
app.get("/api/submissions", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "submissions.json"));
});

// Fallback to index.html for any other routes (SPA-like behavior)
app.get("*", (req, res) => {
  // Only fallback if the request is for an HTML page or doesn't have an extension
  if (req.accepts("html") || !req.url.includes(".")) {
    return res.sendFile(path.join(__dirname, "index.html"));
  }
  res.status(404).send("Not found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server running at http://0.0.0.0:${PORT}`);
});
