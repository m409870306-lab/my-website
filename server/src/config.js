import dotenv from "dotenv";

dotenv.config();

export function getConfig() {
  return {
    port: Number(process.env.PORT || 8787),
    publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:8787",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiImageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    openaiMock: process.env.OPENAI_MOCK !== "false",
  };
}
