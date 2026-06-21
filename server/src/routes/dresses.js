import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Router } from "express";
import { createDress, listActiveDresses } from "../lib/dressStore.js";

export const dressesRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../..");
const dressImageDir = path.join(serverRoot, "dress-images");
fs.mkdirSync(dressImageDir, { recursive: true });

const upload = multer({
  dest: dressImageDir,
  limits: {
    files: 1,
    fileSize: 8 * 1024 * 1024,
  },
});

dressesRouter.get("/", (req, res) => {
  res.json({
    dresses: listActiveDresses(),
  });
});

dressesRouter.post("/", upload.single("dressImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "请上传礼服图片" });
  }

  const dress = createDress({
    code: req.body.code,
    name: req.body.name,
    imageUrl: `/dress-images/${path.basename(req.file.path)}`,
    imagePath: req.file.path,
    category: req.body.category,
    silhouette: req.body.silhouette,
    fabric: req.body.fabric,
    neckline: req.body.neckline,
    sleeve: req.body.sleeve,
    train: req.body.train,
  });

  res.status(201).json({ dress });
});
