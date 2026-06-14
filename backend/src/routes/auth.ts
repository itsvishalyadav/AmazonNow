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

// In-memory store for demo purposes (userId -> tokens)
export const userTokens = new Map<string, any>();

// Load tokens from disk if they exist to survive server restarts
const TOKENS_FILE = path.join(process.cwd(), "src", "data", "userTokens.json");
if (fs.existsSync(TOKENS_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
    for (const [k, v] of Object.entries(data)) {
      userTokens.set(k, v);
    }
  } catch (err) {
    console.error("Failed to load user tokens from disk:", err);
  }
}

function saveTokens() {
  try {
    const obj = Object.fromEntries(userTokens.entries());
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("Failed to save user tokens to disk:", err);
  }
}

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
    // Store tokens in memory and persist to disk
    userTokens.set(userId, tokens);
    saveTokens();
    
    // Redirect back to frontend
    res.redirect(`${FRONTEND_URL}?calendarConnected=true`);
  } catch (err) {
    console.error("Error retrieving access token", err);
    res.status(500).send("Authentication failed");
  }
});

// POST /api/auth/google/disconnect
router.post("/google/disconnect", (req, res) => {
  const userId = req.body.userId || "user-demo-01";
  if (userTokens.has(userId)) {
    // Optionally revoke from Google, but for now just delete locally
    userTokens.delete(userId);
    saveTokens();
  }
  res.json({ success: true });
});

// GET /api/auth/google/status
router.get("/google/status", (req, res) => {
  const userId = req.query.userId as string || "user-demo-01";
  const connected = userTokens.has(userId);
  res.json({ connected });
});

export default router;
