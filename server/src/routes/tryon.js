import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Router } from "express";
import { dresses } from "../data/dresses.js";
import { generateTryOnImage } from "../lib/openaiImageClient.js";
import { buildTryOnPrompt } from "../lib/promptBuilder.js";
import { taskStore } from "../lib/taskStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../..");
const uploadDir = path.join(serverRoot, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    files: 4,
    fileSize: 8 * 1024 * 1024,
  },
});

export const uploadsRouter = Router();
export const tryonRouter = Router();
const uploadedImages = new Map();

uploadsRouter.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "请上传图片" });
  }

  const image = {
    id: `img_${randomUUID()}`,
    path: req.file.path,
    originalName: req.file.originalname,
  };
  uploadedImages.set(image.id, image);
  res.status(201).json({ image });
});

tryonRouter.post("/", upload.array("customerImages", 3), async (req, res) => {
  const multipartFiles = req.files || [];
  const uploadedImageIds = Array.isArray(req.body.uploadedImageIds)
    ? req.body.uploadedImageIds
    : [];
  const uploadedFiles = uploadedImageIds
    .map((id) => uploadedImages.get(id))
    .filter(Boolean)
    .map((image) => ({ path: image.path }));
  const files = multipartFiles.length > 0 ? multipartFiles : uploadedFiles;

  if (files.length < 1) {
    return res.status(400).json({ error: "请至少上传 1 张本人正面照" });
  }
  if (files.length > 3) {
    return res.status(400).json({ error: "本人参考照最多上传 3 张" });
  }

  const dress = dresses.find((item) => item.id === req.body.dressId && item.isActive);
  if (!dress) {
    return res.status(400).json({ error: "请选择有效礼服" });
  }

  const bodyInfoFromJson = req.body.bodyInfo && typeof req.body.bodyInfo === "object" ? req.body.bodyInfo : {};
  const bodyInfo = {
    height: req.body.height || bodyInfoFromJson.height || "",
    weight: req.body.weight || bodyInfoFromJson.weight || "",
    size: req.body.size || bodyInfoFromJson.size || "",
    beautify: req.body.beautify || bodyInfoFromJson.beautify || "natural",
  };

  const task = taskStore.create({
    customerImages: files.map((file) => file.path),
    bodyInfo,
    dressId: dress.id,
    dressImage: dress.imageUrl,
  });

  taskStore.update(task.id, { generationStatus: "processing" });

  queueMicrotask(async () => {
    try {
      const prompt = buildTryOnPrompt({
        dress,
        bodyInfo,
        customerImageCount: files.length,
      });
      const resultImage = await generateTryOnImage({
        prompt,
        imagePaths: files.map((file) => file.path),
        taskId: task.id,
      });
      taskStore.update(task.id, {
        generationStatus: "succeeded",
        resultImage,
        failureReason: "",
      });
    } catch (error) {
      taskStore.update(task.id, {
        generationStatus: "failed",
        failureReason: error.message || "生成失败，请重新尝试",
      });
    }
  });

  res.status(201).json({ task: taskStore.get(task.id) });
});

tryonRouter.get("/:id", (req, res) => {
  const task = taskStore.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "未找到试穿任务" });
  }
  res.json({ task });
});
