import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Direct API route for submissions - MUST BE BEFORE STATIC/CATCH-ALL
app.get("/api/submissions", (req, res) => {
  const filePath = path.join(__dirname, "data", "submissions.json");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ error: "Could not read submissions data" });
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
