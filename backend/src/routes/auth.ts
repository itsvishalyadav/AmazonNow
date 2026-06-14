import { Router } from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const router = Router();

// Retrieve from .env
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4001/api/auth/google/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// We no longer use an in-memory map or disk persistence.
// Tokens will be stored in an HTTP-Only secure cookie on the user's browser.

// GET /api/auth/google
router.get("/google", (req, res) => {
  const userId = req.query.userId as string || "user-demo-01";
  
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId, // pass userId in state to know who is logging in
    prompt: "consent" // Force to get refresh token
  });

  res.redirect(url);
});

// GET /api/auth/google/callback
router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const userId = state as string || "user-demo-01";

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Encode tokens to base64 and pass via URL instead of a third-party cookie
    const tokenStr = Buffer.from(JSON.stringify(tokens)).toString('base64');
    res.redirect(`${FRONTEND_URL}?calendarToken=${encodeURIComponent(tokenStr)}`);
  } catch (err) {
    console.error("Error retrieving access token", err);
    res.status(500).send("Authentication failed");
  }
});

// POST /api/auth/google/disconnect
router.post("/google/disconnect", (req, res) => {
  // Frontend will handle clearing localStorage
  res.json({ success: true });
});

// GET /api/auth/google/status
router.get("/google/status", (req, res) => {
  const connected = !!req.headers['x-calendar-token'];
  res.json({ connected });
});

export default router;
