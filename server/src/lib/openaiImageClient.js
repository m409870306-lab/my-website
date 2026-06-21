import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { getConfig } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../..");

const MOCK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#fbfaf7"/>
  <circle cx="512" cy="190" r="86" fill="#c9a987"/>
  <path d="M310 360 C360 290 664 290 714 360 L812 1380 H212 Z" fill="#ffffff" stroke="#e5d8c8" stroke-width="8"/>
  <path d="M412 340 L512 600 L612 340" fill="none" stroke="#d0b28a" stroke-width="10"/>
  <ellipse cx="512" cy="1220" rx="365" ry="210" fill="#ffffff" opacity="0.9"/>
</svg>`;

export async function generateTryOnImage({ prompt, imagePaths, taskId }) {
  const config = getConfig();
  const outputDir = path.join(serverRoot, "generated");
  await fs.mkdir(outputDir, { recursive: true });

  if (config.openaiMock) {
    const outputPath = path.join(outputDir, `${taskId}.svg`);
    await fs.writeFile(outputPath, MOCK_IMAGE_SVG, "utf8");
    return `${config.publicBaseUrl}/generated/${taskId}.svg`;
  }

  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const handles = await Promise.all(imagePaths.map((imagePath) => fs.open(imagePath, "r")));

  try {
    const result = await client.images.edit({
      model: config.openaiImageModel,
      image: handles.map((handle) => handle.createReadStream()),
      prompt,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = result.data[0].b64_json;
    const outputPath = path.join(outputDir, `${taskId}.png`);
    await fs.writeFile(outputPath, Buffer.from(imageBase64, "base64"));
    return `${config.publicBaseUrl}/generated/${taskId}.png`;
  } finally {
    await Promise.all(handles.map((handle) => handle.close()));
  }
}
