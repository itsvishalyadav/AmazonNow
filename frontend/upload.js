import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const bucketName = "amazon-now-bucket";
const distPath = path.resolve("dist");

async function uploadDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await uploadDir(fullPath);
    } else {
      const key = path.relative(distPath, fullPath).replace(/\\/g, '/');
      const contentType = mime.lookup(fullPath) || "application/octet-stream";
      
      console.log(`Uploading ${key}...`);
      await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fs.readFileSync(fullPath),
        ContentType: contentType
      }));
    }
  }
}

console.log(`Starting upload to ${bucketName}...`);
uploadDir(distPath).then(() => {
  console.log("Upload complete!");
}).catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
