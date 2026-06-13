import { google } from "googleapis";
import { oauth2Client, userTokens } from "../routes/auth.js";

export async function getUpcomingEvents(userId: string) {
  const tokens = userTokens.get(userId);
  if (!tokens) {
    return null; // Not connected
  }

  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Next 48 hours
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
      return null;
    }

    // Return the first valid event
    for (const event of events) {
      if (event.summary) {
        return {
          name: event.summary,
          intent: `Upcoming event: ${event.summary}. Prepare a curated list of items needed for this occasion.`,
        };
      }
    }

    return null;
  } catch (err) {
    console.error("The API returned an error: " + err);
    return null;
  }
}
