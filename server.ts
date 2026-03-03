import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = 3000;

// WebSocket Server for Live Viewers
const wss = new WebSocketServer({ server: httpServer });
let liveViewers = 0;

function broadcastLiveCount() {
  const data = JSON.stringify({ type: "LIVE_COUNT", count: liveViewers });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  liveViewers++;
  broadcastLiveCount();

  ws.on("close", () => {
    liveViewers = Math.max(0, liveViewers - 1);
    broadcastLiveCount();
  });
});

// Visitor counter persistence
const VISITOR_DATA_PATH = path.join(__dirname, "data", "visitor_stats.json");
let totalVisitors = 0;

function loadVisitorStats() {
  try {
    if (fs.existsSync(VISITOR_DATA_PATH)) {
      const data = fs.readFileSync(VISITOR_DATA_PATH, "utf-8");
      totalVisitors = JSON.parse(data).total || 0;
    } else {
      const dataDir = path.join(__dirname, "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
      saveVisitorStats();
    }
  } catch (err) {
    console.error("Error loading visitor stats:", err);
  }
}

function saveVisitorStats() {
  try {
    fs.writeFileSync(VISITOR_DATA_PATH, JSON.stringify({ total: totalVisitors }));
  } catch (err) {
    console.error("Error saving visitor stats:", err);
  }
}

loadVisitorStats();

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Visitor API
app.get("/api/stats", (req, res) => {
  res.json({ total: totalVisitors, live: liveViewers });
});

app.post("/api/stats/hit", (req, res) => {
  totalVisitors++;
  saveVisitorStats();
  res.json({ total: totalVisitors, live: liveViewers });
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

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server running at http://0.0.0.0:${PORT}`);
});
