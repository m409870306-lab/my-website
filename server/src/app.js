import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { dressesRouter } from "./routes/dresses.js";
import { tryonRouter, uploadsRouter } from "./routes/tryon.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/generated", express.static(path.join(serverRoot, "generated")));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/dresses", dressesRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/tryon", tryonRouter);

  return app;
}
