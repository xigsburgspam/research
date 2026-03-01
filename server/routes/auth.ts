import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Talha@2006";

router.post("/login", async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  // In this simple setup, we compare against the environment variable
  // In a real app, you'd fetch the hashed password from a DB
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials." });
});

export default router;
