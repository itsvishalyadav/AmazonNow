require('dotenv').config();
const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

async function checkRegion(region) {
  try {
    const client = new DynamoDBClient({ region });
    const res = await client.send(new ListTablesCommand({}));
    if (res.TableNames && res.TableNames.length > 0) {
      console.log(`Region ${region}:`, res.TableNames);
    }
  } catch (e) {
    console.error(`Region ${region} failed:`, e.message);
  }
}

async function run() {
  await checkRegion("us-east-1");
  await checkRegion("us-west-2");
  await checkRegion("ap-south-1");
}
run();
