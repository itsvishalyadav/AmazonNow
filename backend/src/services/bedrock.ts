import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION || "ap-south-1";

// Initialize the Bedrock Runtime client
// Note: It will automatically pick up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from process.env
const client = new BedrockRuntimeClient({ region: REGION });

// Global cache to avoid re-computing vectors for common queries during runtime
const embeddingCache = new Map<string, number[]>();

/**
 * Calls Amazon Bedrock's Titan Text Embeddings V2 model to generate an embedding.
 * Automatically caches the result in memory.
 */
export async function embedWithBedrock(text: string): Promise<number[]> {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  try {
    const input = {
      // amazon.titan-embed-text-v2:0 is the standard v2 model ID
      modelId: "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: text,
        // Optional parameters for Titan v2
        dimensions: 256, // Request 256 dimensions for faster cosine similarity
        normalize: true,
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    // The response body is a Uint8Array. We need to decode it to JSON.
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const embedding = responseBody.embedding as number[];

    embeddingCache.set(text, embedding);
    return embedding;
  } catch (error) {
    console.error("[bedrock] Error generating embedding:", error);
    // Return an empty array or throw. Since we need vectors for similarity, throwing is safer.
    throw error;
  }
}
