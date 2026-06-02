import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logging middleware for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Serve background videos directly
  app.use("/videos", express.static(path.resolve(process.cwd(), "videos")));

  // Direct API route for submissions
  app.get("/api/submissions", (req, res) => {
    const filePath = path.resolve(process.cwd(), "data", "research.json");
    console.log(`Serving research metadata from: ${filePath}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: "Could not read research data", details: (err as Error).message });
      } else {
        console.log("Research metadata served successfully");
      }
    });
  });

  // Serve static assets/data if dev server is in production route
  app.use("/data", express.static(path.resolve(process.cwd(), "data")));

  // Vite development middleware vs Static file production distribution
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // API misses default to 404
      if (req.url.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Team Xiro Gravity custom server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal error starting server:", error);
});
