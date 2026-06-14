import "dotenv/config";
import { getUser } from "./src/services/dynamodb.js";

async function run() {
  const user = await getUser("user-demo-01");
  console.log(JSON.stringify(user, null, 2));
}
run().catch(console.error);
