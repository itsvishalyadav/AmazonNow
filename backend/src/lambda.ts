import serverless from "serverless-http";
import app from "./index.js";

// Wrap the express app
export const handler = serverless(app);
