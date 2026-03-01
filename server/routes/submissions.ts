import express from "express";
import { getAllSubmissions, updateSubmission, deleteSubmission } from "../services/googleSheets.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = express.Router();

// Public: Get all active submissions
router.get("/", async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    // Filter out removed submissions for public view
    const publicSubmissions = submissions.filter(s => s.status !== "Removed");
    res.json(publicSubmissions);
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
});

// Admin: Get all submissions (including removed)
router.get("/admin", authenticateToken, async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
});

// Admin: Update a submission
router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const success = await updateSubmission(id, updates);
    if (success) {
      res.json({ message: "Submission updated successfully" });
    } else {
      res.status(404).json({ message: "Submission not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update submission", error: error.message });
  }
});

// Admin: Delete a submission
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const success = await deleteSubmission(id);
    if (success) {
      res.json({ message: "Submission deleted successfully" });
    } else {
      res.status(404).json({ message: "Submission not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete submission", error: error.message });
  }
});

export default router;
