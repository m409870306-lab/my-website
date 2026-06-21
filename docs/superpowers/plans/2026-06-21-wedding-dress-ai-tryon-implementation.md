# Wedding Dress AI Try-On Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working WeChat Mini Program MVP where a customer uploads 1-3 photos, optionally enters body information, selects a seeded wedding dress, and receives a body-aware AI try-on result.

**Architecture:** Use a native WeChat Mini Program for the customer flow and a small Node/Express backend for upload handling, task state, prompt construction, and OpenAI image editing. The backend owns the OpenAI API key and exposes a mock mode so the UI can be tested without spending API calls.

**Tech Stack:** WeChat Mini Program native WXML/WXSS/JS, Node.js 20+, Express, Multer, OpenAI Node SDK, Vitest, Supertest.

---

## Scope

This plan implements the customer MVP only:

- Home page
- Customer photo upload, max 3 photos
- Optional body information
- Dress selection from seeded local data
- Generation task creation and polling
- Full-screen result page with title above the image, never covering the person

Merchant-side dress upload and customer record management are intentionally out of this MVP. Seeded dress data gives the customer flow a working dress library while keeping the first build testable.

## File Structure

Create these top-level areas:

- `server/`: local backend, API routes, OpenAI adapter, prompt builder, in-memory task store, tests.
- `miniprogram/`: WeChat Mini Program pages, shared config, and seeded dress data.
- `docs/superpowers/specs/`: already contains the approved design.
- `docs/superpowers/plans/`: this implementation plan.

Planned files:

- Create: `package.json` - workspace scripts for server install, tests, and dev.
- Create: `.gitignore` - ignore dependencies, env files, generated uploads, and preview artifacts.
- Create: `.env.example` - OpenAI and server configuration template.
- Create: `server/package.json` - backend dependencies and scripts.
- Create: `server/src/app.js` - Express app setup.
- Create: `server/src/index.js` - server bootstrap.
- Create: `server/src/config.js` - environment parsing.
- Create: `server/src/data/dresses.js` - seeded dress records.
- Create: `server/src/lib/promptBuilder.js` - deterministic prompt construction.
- Create: `server/src/lib/taskStore.js` - in-memory task persistence for MVP.
- Create: `server/src/lib/openaiImageClient.js` - OpenAI image edit adapter and mock image output.
- Create: `server/src/routes/dresses.js` - dress list API.
- Create: `server/src/routes/tryon.js` - create task, upload files, poll task.
- Create: `server/tests/promptBuilder.test.js`
- Create: `server/tests/taskStore.test.js`
- Create: `server/tests/tryon.routes.test.js`
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/utils/api.js`
- Create: `miniprogram/utils/tryonState.js`
- Create: `miniprogram/data/dresses.js`
- Create: `miniprogram/pages/home/home.js`
- Create: `miniprogram/pages/home/home.wxml`
- Create: `miniprogram/pages/home/home.wxss`
- Create: `miniprogram/pages/upload/upload.js`
- Create: `miniprogram/pages/upload/upload.wxml`
- Create: `miniprogram/pages/upload/upload.wxss`
- Create: `miniprogram/pages/body/body.js`
- Create: `miniprogram/pages/body/body.wxml`
- Create: `miniprogram/pages/body/body.wxss`
- Create: `miniprogram/pages/dresses/dresses.js`
- Create: `miniprogram/pages/dresses/dresses.wxml`
- Create: `miniprogram/pages/dresses/dresses.wxss`
- Create: `miniprogram/pages/generating/generating.js`
- Create: `miniprogram/pages/generating/generating.wxml`
- Create: `miniprogram/pages/generating/generating.wxss`
- Create: `miniprogram/pages/result/result.js`
- Create: `miniprogram/pages/result/result.wxml`
- Create: `miniprogram/pages/result/result.wxss`

## Task 1: Scaffold Project and Backend Test Harness

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `server/package.json`
- Create: `server/src/config.js`
- Create: `server/src/app.js`
- Create: `server/src/index.js`

- [ ] **Step 1: Create root project metadata**

Create `package.json`:

```json
{
  "name": "wedding-dress-ai-tryon",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "server:install": "npm --prefix server install",
    "server:dev": "npm --prefix server run dev",
    "server:test": "npm --prefix server test",
    "test": "npm run server:test"
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
server/node_modules/
.env
server/.env
server/uploads/
server/generated/
.superpowers/
*.log
```

Create `.env.example`:

```bash
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_MOCK=true
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787
```

- [ ] **Step 2: Create backend package**

Create `server/package.json`:

```json
{
  "name": "wedding-dress-ai-tryon-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1",
    "openai": "^5.0.0",
    "uuid": "^11.0.5"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Write config module**

Create `server/src/config.js`:

```js
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
```

- [ ] **Step 4: Write Express app skeleton**

Create `server/src/app.js`:

```js
import cors from "cors";
import express from "express";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  return app;
}
```

Create `server/src/index.js`:

```js
import { createApp } from "./app.js";
import { getConfig } from "./config.js";

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`Wedding try-on server listening on ${config.port}`);
});
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm run server:install
```

Expected: dependencies install under `server/node_modules`.

- [ ] **Step 6: Verify health endpoint manually**

Run:

```bash
npm run server:dev
```

In another terminal, run:

```bash
curl http://localhost:8787/health
```

Expected:

```json
{"ok":true}
```

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore .env.example server/package.json server/src/config.js server/src/app.js server/src/index.js
git commit -m "chore: scaffold try-on backend"
```

## Task 2: Add Domain Data and Prompt Builder

**Files:**
- Create: `server/src/data/dresses.js`
- Create: `server/src/lib/promptBuilder.js`
- Create: `server/tests/promptBuilder.test.js`

- [ ] **Step 1: Write failing prompt tests**

Create `server/tests/promptBuilder.test.js`:

```js
import { describe, expect, it } from "vitest";
import { buildTryOnPrompt } from "../src/lib/promptBuilder.js";

describe("buildTryOnPrompt", () => {
  it("prioritizes customer identity and body-aware dress fitting", () => {
    const prompt = buildTryOnPrompt({
      dress: {
        code: "W-1028",
        name: "缎面 A 字主纱",
        silhouette: "A-line",
        fabric: "ivory satin",
        neckline: "square neck",
        sleeve: "sleeveless",
        train: "chapel train",
      },
      bodyInfo: {
        height: "165",
        weight: "52",
        size: "M",
        beautify: "natural",
      },
      customerImageCount: 3,
    });

    expect(prompt).toContain("preserve the customer's facial identity");
    expect(prompt).toContain("adapt the wedding dress to the customer's body proportions");
    expect(prompt).toContain("W-1028");
    expect(prompt).toContain("ivory satin");
    expect(prompt).toContain("height 165cm");
    expect(prompt).toContain("Do not cover the head or face");
    expect(prompt).toContain("No text, watermark, logo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix server test -- promptBuilder.test.js
```

Expected: FAIL because `server/src/lib/promptBuilder.js` does not exist.

- [ ] **Step 3: Create seeded dresses**

Create `server/src/data/dresses.js`:

```js
export const dresses = [
  {
    id: "dress-satin-a-line",
    code: "W-1028",
    name: "缎面 A 字主纱",
    imageUrl: "/static/dresses/satin-a-line.svg",
    category: "主纱",
    silhouette: "A-line",
    fabric: "ivory satin",
    neckline: "square neck",
    sleeve: "sleeveless",
    train: "chapel train",
    isActive: true,
  },
  {
    id: "dress-lace-mermaid",
    code: "W-1036",
    name: "蕾丝鱼尾长袖",
    imageUrl: "/static/dresses/lace-mermaid.svg",
    category: "主纱",
    silhouette: "mermaid",
    fabric: "floral lace",
    neckline: "off shoulder",
    sleeve: "long sleeve",
    train: "sweep train",
    isActive: true,
  },
  {
    id: "dress-pearl-ballgown",
    code: "W-1062",
    name: "珍珠束腰大拖尾",
    imageUrl: "/static/dresses/pearl-ballgown.svg",
    category: "主纱",
    silhouette: "ball gown",
    fabric: "pearl tulle",
    neckline: "corset bodice",
    sleeve: "strapless",
    train: "cathedral train",
    isActive: true,
  },
  {
    id: "dress-minimal-cape",
    code: "W-1088",
    name: "极简披肩缎面款",
    imageUrl: "/static/dresses/minimal-cape.svg",
    category: "主纱",
    silhouette: "sheath",
    fabric: "silk crepe",
    neckline: "high neck",
    sleeve: "cape veil",
    train: "short train",
    isActive: true,
  },
];
```

- [ ] **Step 4: Implement prompt builder**

Create `server/src/lib/promptBuilder.js`:

```js
function bodyInfoLine(bodyInfo) {
  if (!bodyInfo) return "No optional body info was provided.";

  const parts = [];
  if (bodyInfo.height) parts.push(`height ${bodyInfo.height}cm`);
  if (bodyInfo.weight) parts.push(`weight ${bodyInfo.weight}kg`);
  if (bodyInfo.size) parts.push(`usual size ${bodyInfo.size}`);
  if (bodyInfo.beautify) parts.push(`beauty preference ${bodyInfo.beautify}`);

  return parts.length > 0 ? parts.join(", ") : "No optional body info was provided.";
}

export function buildTryOnPrompt({ dress, bodyInfo, customerImageCount }) {
  return [
    "Create a premium photorealistic bridal try-on image.",
    `Use ${customerImageCount} customer reference image(s) to preserve the customer's facial identity, hairstyle, skin tone, natural body presence, and overall temperament.`,
    "Use the wedding dress reference image as the garment source.",
    `Dress: ${dress.code} ${dress.name}, ${dress.silhouette}, ${dress.fabric}, ${dress.neckline}, ${dress.sleeve}, ${dress.train}.`,
    `Optional body info: ${bodyInfoLine(bodyInfo)}.`,
    "Primary requirement: preserve the customer's facial identity before any beautification.",
    "Body-aware fitting requirement: adapt the wedding dress to the customer's body proportions, including shoulder width, neckline placement, bodice tension, waistline, skirt volume, hem length, and train scale.",
    "Do not apply a universal slimming effect. Only use natural light beautification that does not change identity.",
    "Keep a natural front-facing bridal fitting pose and realistic luxury bridal atelier lighting.",
    "Do not cover the head or face. Keep the full person visible.",
    "No text, watermark, logo, brand mark, distorted hands, cropped head, or exaggerated fantasy body shape.",
  ].join("\\n");
}
```

- [ ] **Step 5: Run prompt tests**

Run:

```bash
npm --prefix server test -- promptBuilder.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/data/dresses.js server/src/lib/promptBuilder.js server/tests/promptBuilder.test.js
git commit -m "feat: add try-on prompt builder"
```

## Task 3: Add Task Store and Dress API

**Files:**
- Create: `server/src/lib/taskStore.js`
- Create: `server/src/routes/dresses.js`
- Modify: `server/src/app.js`
- Create: `server/tests/taskStore.test.js`

- [ ] **Step 1: Write failing task store tests**

Create `server/tests/taskStore.test.js`:

```js
import { describe, expect, it } from "vitest";
import { createTaskStore } from "../src/lib/taskStore.js";

describe("createTaskStore", () => {
  it("creates and updates a try-on task", () => {
    const store = createTaskStore();
    const task = store.create({
      customerImages: ["a.png"],
      bodyInfo: { height: "165" },
      dressId: "dress-satin-a-line",
    });

    expect(task.id).toMatch(/^tryon_/);
    expect(task.generationStatus).toBe("pending");

    const updated = store.update(task.id, {
      generationStatus: "succeeded",
      resultImage: "http://localhost:8787/generated/result.png",
    });

    expect(updated.resultImage).toContain("result.png");
    expect(store.get(task.id).generationStatus).toBe("succeeded");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm --prefix server test -- taskStore.test.js
```

Expected: FAIL because `taskStore.js` does not exist.

- [ ] **Step 3: Implement task store**

Create `server/src/lib/taskStore.js`:

```js
import { randomUUID } from "node:crypto";

export function createTaskStore() {
  const tasks = new Map();

  return {
    create(input) {
      const now = new Date().toISOString();
      const task = {
        id: `tryon_${randomUUID()}`,
        customerImages: input.customerImages,
        bodyInfo: input.bodyInfo || {},
        dressId: input.dressId,
        dressImage: input.dressImage || "",
        generationStatus: "pending",
        resultImage: "",
        failureReason: "",
        createdAt: now,
        updatedAt: now,
      };
      tasks.set(task.id, task);
      return task;
    },

    get(id) {
      return tasks.get(id) || null;
    },

    update(id, patch) {
      const existing = tasks.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      tasks.set(id, updated);
      return updated;
    },
  };
}

export const taskStore = createTaskStore();
```

- [ ] **Step 4: Add dress route**

Create `server/src/routes/dresses.js`:

```js
import { Router } from "express";
import { dresses } from "../data/dresses.js";

export const dressesRouter = Router();

dressesRouter.get("/", (req, res) => {
  res.json({
    dresses: dresses.filter((dress) => dress.isActive),
  });
});
```

- [ ] **Step 5: Register dress route**

Modify `server/src/app.js`:

```js
import cors from "cors";
import express from "express";
import { dressesRouter } from "./routes/dresses.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/dresses", dressesRouter);

  return app;
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm --prefix server test
```

Expected: all tests PASS.

- [ ] **Step 7: Manually verify dress API**

Run:

```bash
curl http://localhost:8787/api/dresses
```

Expected: JSON includes `W-1028` and four active dresses.

- [ ] **Step 8: Commit**

```bash
git add server/src/lib/taskStore.js server/src/routes/dresses.js server/src/app.js server/tests/taskStore.test.js
git commit -m "feat: add try-on task store and dress API"
```

## Task 4: Add Try-On API with Mock OpenAI Generation

**Files:**
- Create: `server/src/lib/openaiImageClient.js`
- Create: `server/src/routes/tryon.js`
- Modify: `server/src/app.js`
- Create: `server/tests/tryon.routes.test.js`

- [ ] **Step 1: Write failing route tests**

Create `server/tests/tryon.routes.test.js`:

```js
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("try-on routes", () => {
  it("rejects task creation without a required front image", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/tryon")
      .field("dressId", "dress-satin-a-line");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("请至少上传 1 张本人正面照");
  });

  it("creates a mock try-on task with one customer image", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/tryon")
      .field("dressId", "dress-satin-a-line")
      .field("height", "165")
      .attach("customerImages", Buffer.from("fake image"), "front.png");

    expect(response.status).toBe(201);
    expect(response.body.task.id).toMatch(/^tryon_/);
    expect(response.body.task.generationStatus).toBe("processing");
  });

  it("uploads separate customer images and creates a task from uploaded image ids", async () => {
    const app = createApp();

    const uploadA = await request(app)
      .post("/api/uploads")
      .attach("image", Buffer.from("fake front image"), "front.png");
    const uploadB = await request(app)
      .post("/api/uploads")
      .attach("image", Buffer.from("fake face image"), "face.png");

    const response = await request(app)
      .post("/api/tryon")
      .send({
        dressId: "dress-satin-a-line",
        uploadedImageIds: [uploadA.body.image.id, uploadB.body.image.id],
        bodyInfo: { height: "165", size: "M", beautify: "natural" },
      });

    expect(response.status).toBe(201);
    expect(response.body.task.customerImages).toHaveLength(2);
    expect(response.body.task.generationStatus).toBe("processing");
  });
});
```

- [ ] **Step 2: Run route tests to verify they fail**

Run:

```bash
npm --prefix server test -- tryon.routes.test.js
```

Expected: FAIL because `/api/tryon` is not registered.

- [ ] **Step 3: Implement OpenAI image client with mock mode**

Create `server/src/lib/openaiImageClient.js`:

```js
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { getConfig } from "../config.js";

const MOCK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#fbfaf7"/>
  <circle cx="512" cy="190" r="86" fill="#c9a987"/>
  <path d="M310 360 C360 290 664 290 714 360 L812 1380 H212 Z" fill="#ffffff" stroke="#e5d8c8" stroke-width="8"/>
  <path d="M412 340 L512 600 L612 340" fill="none" stroke="#d0b28a" stroke-width="10"/>
  <ellipse cx="512" cy="1220" rx="365" ry="210" fill="#ffffff" opacity="0.9"/>
</svg>`;

export async function generateTryOnImage({ prompt, imagePaths, taskId }) {
  const config = getConfig();
  const outputDir = path.resolve("server/generated");
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
  const imageFiles = await Promise.all(
    imagePaths.map(async (imagePath) => {
      const file = await fs.open(imagePath, "r");
      return file.createReadStream();
    }),
  );

  const result = await client.images.edit({
    model: config.openaiImageModel,
    image: imageFiles,
    prompt,
    size: "1024x1536",
    quality: "medium",
  });

  const imageBase64 = result.data[0].b64_json;
  const outputPath = path.join(outputDir, `${taskId}.png`);
  await fs.writeFile(outputPath, Buffer.from(imageBase64, "base64"));
  return `${config.publicBaseUrl}/generated/${taskId}.png`;
}
```

- [ ] **Step 4: Implement try-on routes**

Create `server/src/routes/tryon.js`:

```js
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { Router } from "express";
import { dresses } from "../data/dresses.js";
import { generateTryOnImage } from "../lib/openaiImageClient.js";
import { buildTryOnPrompt } from "../lib/promptBuilder.js";
import { taskStore } from "../lib/taskStore.js";

const uploadDir = path.resolve("server/uploads");
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
```

- [ ] **Step 5: Register try-on route and generated files**

Modify `server/src/app.js`:

```js
import path from "node:path";
import cors from "cors";
import express from "express";
import { dressesRouter } from "./routes/dresses.js";
import { tryonRouter, uploadsRouter } from "./routes/tryon.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/generated", express.static(path.resolve("server/generated")));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/dresses", dressesRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/tryon", tryonRouter);

  return app;
}
```

- [ ] **Step 6: Run route tests**

Run:

```bash
npm --prefix server test -- tryon.routes.test.js
```

Expected: PASS.

- [ ] **Step 7: Run all backend tests**

Run:

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add server/src/lib/openaiImageClient.js server/src/routes/tryon.js server/src/app.js server/tests/tryon.routes.test.js
git commit -m "feat: add mock try-on generation API"
```

## Task 5: Scaffold WeChat Mini Program Shell

**Files:**
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/utils/api.js`
- Create: `miniprogram/utils/tryonState.js`
- Create: `miniprogram/data/dresses.js`

- [ ] **Step 1: Create Mini Program app config**

Create `miniprogram/app.json`:

```json
{
  "pages": [
    "pages/home/home",
    "pages/upload/upload",
    "pages/body/body",
    "pages/dresses/dresses",
    "pages/generating/generating",
    "pages/result/result"
  ],
  "window": {
    "navigationBarTitleText": "婚纱试穿",
    "navigationBarBackgroundColor": "#fbfaf7",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#fbfaf7"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

Create `miniprogram/app.js`:

```js
App({
  globalData: {
    apiBaseUrl: "http://localhost:8787",
  },
});
```

Create `miniprogram/sitemap.json`:

```json
{
  "rules": [
    {
      "action": "allow",
      "page": "*"
    }
  ]
}
```

Create `miniprogram/project.config.json`:

```json
{
  "appid": "touristappid",
  "projectname": "wedding-dress-ai-tryon",
  "miniprogramRoot": "./",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram"
}
```

- [ ] **Step 2: Create global styles**

Create `miniprogram/app.wxss`:

```css
page {
  min-height: 100%;
  background: #fbfaf7;
  color: #211d19;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx;
  background: #fbfaf7;
}

.serif-title {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 500;
  color: #211d19;
}

.primary-button {
  height: 92rpx;
  border-radius: 999rpx;
  background: #211d19;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.secondary-text {
  color: #74695e;
  line-height: 1.6;
}
```

- [ ] **Step 3: Create API helper**

Create `miniprogram/utils/api.js`:

```js
function baseUrl() {
  return getApp().globalData.apiBaseUrl;
}

export function request({ url, method = "GET", data }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl()}${url}`,
      method,
      data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || "请求失败"));
        }
      },
      fail: () => reject(new Error("网络连接失败")),
    });
  });
}

export function uploadCustomerImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${baseUrl()}/api/uploads`,
      filePath,
      name: "image",
      success: (res) => {
        const data = JSON.parse(res.data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data.image);
        } else {
          reject(new Error(data.error || "上传图片失败"));
        }
      },
      fail: () => reject(new Error("上传图片失败，请检查网络")),
    });
  });
}

export function uploadTryOn({ imagePaths, bodyInfo, dressId }) {
  return Promise.all(imagePaths.map((filePath) => uploadCustomerImage(filePath))).then((images) => {
    return request({
      url: "/api/tryon",
      method: "POST",
      data: {
        dressId,
        uploadedImageIds: images.map((image) => image.id),
        bodyInfo,
      },
    });
  });
}
```

Note for implementation: native `wx.uploadFile` uploads one file per request, so the Mini Program uploads each selected customer photo to `/api/uploads` first, then creates one `/api/tryon` task with the returned image ids. This preserves the confirmed requirement that the MVP supports 1-3 customer reference photos.

- [ ] **Step 4: Create shared state helper**

Create `miniprogram/utils/tryonState.js`:

```js
const state = {
  imagePaths: [],
  bodyInfo: {
    height: "",
    weight: "",
    size: "",
    beautify: "natural",
  },
  dress: null,
  task: null,
};

export function getTryOnState() {
  return state;
}

export function setCustomerImages(imagePaths) {
  state.imagePaths = imagePaths;
}

export function setBodyInfo(bodyInfo) {
  state.bodyInfo = {
    ...state.bodyInfo,
    ...bodyInfo,
  };
}

export function setDress(dress) {
  state.dress = dress;
}

export function setTask(task) {
  state.task = task;
}

export function resetTryOnState() {
  state.imagePaths = [];
  state.bodyInfo = { height: "", weight: "", size: "", beautify: "natural" };
  state.dress = null;
  state.task = null;
}
```

- [ ] **Step 5: Add seeded Mini Program dress data**

Create `miniprogram/data/dresses.js`:

```js
export const seededDresses = [
  {
    id: "dress-satin-a-line",
    code: "W-1028",
    name: "缎面 A 字主纱",
    category: "主纱",
    silhouette: "A-line",
    fabric: "ivory satin",
  },
  {
    id: "dress-lace-mermaid",
    code: "W-1036",
    name: "蕾丝鱼尾长袖",
    category: "主纱",
    silhouette: "mermaid",
    fabric: "floral lace",
  },
  {
    id: "dress-pearl-ballgown",
    code: "W-1062",
    name: "珍珠束腰大拖尾",
    category: "主纱",
    silhouette: "ball gown",
    fabric: "pearl tulle",
  },
  {
    id: "dress-minimal-cape",
    code: "W-1088",
    name: "极简披肩缎面款",
    category: "主纱",
    silhouette: "sheath",
    fabric: "silk crepe",
  },
];
```

- [ ] **Step 6: Open in WeChat DevTools**

Open `D:\婚纱试穿小程序\miniprogram` in WeChat DevTools.

Expected: project loads with no app configuration error.

- [ ] **Step 7: Commit**

```bash
git add miniprogram/app.js miniprogram/app.json miniprogram/app.wxss miniprogram/project.config.json miniprogram/sitemap.json miniprogram/utils/api.js miniprogram/utils/tryonState.js miniprogram/data/dresses.js
git commit -m "feat: scaffold mini program shell"
```

## Task 6: Build Home, Upload, and Body Info Pages

**Files:**
- Create: `miniprogram/pages/home/home.js`
- Create: `miniprogram/pages/home/home.wxml`
- Create: `miniprogram/pages/home/home.wxss`
- Create: `miniprogram/pages/upload/upload.js`
- Create: `miniprogram/pages/upload/upload.wxml`
- Create: `miniprogram/pages/upload/upload.wxss`
- Create: `miniprogram/pages/body/body.js`
- Create: `miniprogram/pages/body/body.wxml`
- Create: `miniprogram/pages/body/body.wxss`

- [ ] **Step 1: Create home page**

Create `miniprogram/pages/home/home.js`:

```js
Page({
  startTryOn() {
    wx.navigateTo({ url: "/pages/upload/upload" });
  },
});
```

Create `miniprogram/pages/home/home.wxml`:

```xml
<view class="page home">
  <view class="hero">
    <text class="eyebrow">Premium bridal try-on</text>
    <text class="serif-title title">婚纱礼服 AI 试穿</text>
    <text class="secondary-text copy">上传本人正面照，选择店内礼服，生成保留本人相似度并按体型适配的试穿效果图。</text>
  </view>

  <view class="process">
    <view class="process-item">上传本人照</view>
    <view class="process-item">填写体型信息</view>
    <view class="process-item">选择礼服</view>
  </view>

  <view class="primary-button" bindtap="startTryOn">开始试穿</view>
</view>
```

Create `miniprogram/pages/home/home.wxss`:

```css
.home {
  display: flex;
  flex-direction: column;
  gap: 36rpx;
}

.hero {
  padding: 44rpx 0 20rpx;
}

.eyebrow {
  color: #9b7b52;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

.title {
  display: block;
  margin-top: 18rpx;
  font-size: 68rpx;
  line-height: 1.08;
}

.copy {
  display: block;
  margin-top: 22rpx;
  font-size: 28rpx;
}

.process {
  display: grid;
  gap: 18rpx;
}

.process-item {
  padding: 28rpx;
  border: 1rpx solid #e9ded3;
  border-radius: 24rpx;
  background: #ffffff;
  color: #5f554b;
}
```

- [ ] **Step 2: Create upload page**

Create `miniprogram/pages/upload/upload.js`:

```js
import { setCustomerImages } from "../../utils/tryonState";

Page({
  data: {
    imagePaths: [],
    slots: ["正面照", "五官参考", "全身比例"],
  },

  chooseImages() {
    wx.chooseMedia({
      count: 3,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const imagePaths = res.tempFiles.map((file) => file.tempFilePath).slice(0, 3);
        this.setData({ imagePaths });
        setCustomerImages(imagePaths);
      },
    });
  },

  next() {
    if (this.data.imagePaths.length < 1) {
      wx.showToast({ title: "请至少上传 1 张正面照", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/body/body" });
  },
});
```

Create `miniprogram/pages/upload/upload.wxml`:

```xml
<view class="page upload">
  <view>
    <text class="serif-title title">上传本人照</text>
    <text class="secondary-text copy">正面照必传，最多 3 张。照片越清晰，相似度和体型比例越稳定。</text>
  </view>

  <view class="slots">
    <block wx:for="{{slots}}" wx:key="*this">
      <view class="slot" bindtap="chooseImages">
        <view class="preview {{imagePaths[index] ? 'has-image' : ''}}">
          <image wx:if="{{imagePaths[index]}}" src="{{imagePaths[index]}}" mode="aspectFill" />
          <text wx:else>+</text>
        </view>
        <view>
          <text class="slot-title">{{item}}</text>
          <text class="slot-copy">{{index === 0 ? '必传：脸部与主体姿态' : '可选：增强生成稳定性'}}</text>
        </view>
      </view>
    </block>
  </view>

  <view class="tips">请使用光线清晰、无遮挡、无强滤镜的照片。</view>
  <view class="primary-button" bindtap="next">下一步</view>
</view>
```

Create `miniprogram/pages/upload/upload.wxss`:

```css
.upload {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.title {
  display: block;
  font-size: 52rpx;
  line-height: 1.12;
}

.copy {
  display: block;
  margin-top: 16rpx;
  font-size: 27rpx;
}

.slots {
  display: grid;
  gap: 18rpx;
}

.slot {
  display: grid;
  grid-template-columns: 112rpx 1fr;
  gap: 20rpx;
  align-items: center;
  padding: 18rpx;
  border: 1rpx solid #eadfd4;
  border-radius: 28rpx;
  background: #ffffff;
}

.preview {
  width: 112rpx;
  height: 112rpx;
  border-radius: 22rpx;
  background: #f0e5da;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9b7b52;
  font-size: 44rpx;
  overflow: hidden;
}

.preview image {
  width: 100%;
  height: 100%;
}

.slot-title {
  display: block;
  font-size: 30rpx;
  color: #211d19;
}

.slot-copy {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #74695e;
}

.tips {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f1e8de;
  color: #6a5c4d;
  font-size: 24rpx;
}
```

- [ ] **Step 3: Create body info page**

Create `miniprogram/pages/body/body.js`:

```js
import { setBodyInfo } from "../../utils/tryonState";

Page({
  data: {
    height: "",
    weight: "",
    size: "",
    beautify: "natural",
    sizes: ["S", "M", "L", "XL"],
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  onSizeChange(event) {
    this.setData({ size: this.data.sizes[Number(event.detail.value)] });
  },

  next() {
    setBodyInfo({
      height: this.data.height,
      weight: this.data.weight,
      size: this.data.size,
      beautify: this.data.beautify,
    });
    wx.navigateTo({ url: "/pages/dresses/dresses" });
  },
});
```

Create `miniprogram/pages/body/body.wxml`:

```xml
<view class="page body">
  <view>
    <text class="serif-title title">体型信息</text>
    <text class="secondary-text copy">可选填写。信息越完整，礼服腰线、肩宽和裙摆比例越稳定。</text>
  </view>

  <view class="form">
    <view class="field">
      <text>身高 cm</text>
      <input type="number" placeholder="可选" value="{{height}}" data-field="height" bindinput="onInput" />
    </view>
    <view class="field">
      <text>体重 kg</text>
      <input type="number" placeholder="可选" value="{{weight}}" data-field="weight" bindinput="onInput" />
    </view>
    <view class="field">
      <text>平时尺码</text>
      <picker range="{{sizes}}" bindchange="onSizeChange">
        <text>{{size || '可选'}}</text>
      </picker>
    </view>
  </view>

  <view class="primary-button" bindtap="next">选择礼服</view>
</view>
```

Create `miniprogram/pages/body/body.wxss`:

```css
.body {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.title {
  display: block;
  font-size: 52rpx;
}

.copy {
  display: block;
  margin-top: 16rpx;
  font-size: 27rpx;
}

.form {
  border: 1rpx solid #eadfd4;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 8rpx 28rpx;
}

.field {
  min-height: 100rpx;
  border-bottom: 1rpx solid #eee4da;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  color: #5f554b;
}

.field:last-child {
  border-bottom: 0;
}

.field input {
  text-align: right;
}
```

- [ ] **Step 4: Verify in WeChat DevTools**

Expected:

- Home page opens.
- Tapping “开始试穿” opens upload page.
- Upload page allows 1-3 images.
- “下一步” blocks when no image is selected.
- Body page allows skipping all fields.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/home miniprogram/pages/upload miniprogram/pages/body
git commit -m "feat: add upload and body info flow"
```

## Task 7: Build Dress Selection, Generation, and Result Pages

**Files:**
- Create: `miniprogram/pages/dresses/dresses.js`
- Create: `miniprogram/pages/dresses/dresses.wxml`
- Create: `miniprogram/pages/dresses/dresses.wxss`
- Create: `miniprogram/pages/generating/generating.js`
- Create: `miniprogram/pages/generating/generating.wxml`
- Create: `miniprogram/pages/generating/generating.wxss`
- Create: `miniprogram/pages/result/result.js`
- Create: `miniprogram/pages/result/result.wxml`
- Create: `miniprogram/pages/result/result.wxss`

- [ ] **Step 1: Create dress selection page**

Create `miniprogram/pages/dresses/dresses.js`:

```js
import { seededDresses } from "../../data/dresses";
import { setDress } from "../../utils/tryonState";

Page({
  data: {
    dresses: seededDresses,
    selectedId: "",
  },

  selectDress(event) {
    const dress = this.data.dresses.find((item) => item.id === event.currentTarget.dataset.id);
    this.setData({ selectedId: dress.id });
    setDress(dress);
  },

  next() {
    if (!this.data.selectedId) {
      wx.showToast({ title: "请选择一件礼服", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/generating/generating" });
  },
});
```

Create `miniprogram/pages/dresses/dresses.wxml`:

```xml
<view class="page dresses">
  <view>
    <text class="serif-title title">选择礼服</text>
    <text class="secondary-text copy">先用店内热款试穿。正式版会使用你上传的真实礼服照片。</text>
  </view>

  <view class="dress-grid">
    <block wx:for="{{dresses}}" wx:key="id">
      <view class="dress-card {{selectedId === item.id ? 'selected' : ''}}" data-id="{{item.id}}" bindtap="selectDress">
        <view class="dress-art"></view>
        <text class="dress-name">{{item.name}}</text>
        <text class="dress-meta">{{item.code}} · {{item.category}}</text>
      </view>
    </block>
  </view>

  <view class="primary-button" bindtap="next">生成试穿图</view>
</view>
```

Create `miniprogram/pages/dresses/dresses.wxss`:

```css
.dresses {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.title {
  display: block;
  font-size: 52rpx;
}

.copy {
  display: block;
  margin-top: 16rpx;
  font-size: 27rpx;
}

.dress-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.dress-card {
  border: 1rpx solid #eadfd4;
  border-radius: 28rpx;
  background: #ffffff;
  padding: 18rpx;
}

.dress-card.selected {
  border-color: #9b7b52;
  box-shadow: 0 16rpx 40rpx rgba(80, 60, 38, 0.12);
}

.dress-art {
  height: 220rpx;
  border-radius: 22rpx;
  background: radial-gradient(ellipse at 50% 85%, #ffffff 0%, #ffffff 44%, transparent 45%),
    linear-gradient(150deg, transparent 0%, transparent 30%, #ffffff 31%, #ffffff 64%, transparent 65%),
    #efe4d9;
}

.dress-name {
  display: block;
  margin-top: 14rpx;
  font-size: 27rpx;
  color: #211d19;
}

.dress-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #74695e;
}
```

- [ ] **Step 2: Create generating page**

Create `miniprogram/pages/generating/generating.js`:

```js
import { request, uploadTryOn } from "../../utils/api";
import { getTryOnState, setTask } from "../../utils/tryonState";

Page({
  data: {
    statusText: "正在准备生成",
    taskId: "",
  },

  onLoad() {
    this.startGeneration();
  },

  async startGeneration() {
    const state = getTryOnState();
    if (!state.imagePaths.length || !state.dress) {
      wx.showToast({ title: "请先上传照片并选择礼服", icon: "none" });
      wx.navigateTo({ url: "/pages/upload/upload" });
      return;
    }

    try {
      this.setData({ statusText: "正在上传照片" });
      const response = await uploadTryOn({
        imagePaths: state.imagePaths,
        bodyInfo: state.bodyInfo,
        dressId: state.dress.id,
      });
      setTask(response.task);
      this.setData({ taskId: response.task.id, statusText: "正在处理相似度与体型比例" });
      this.pollTask(response.task.id);
    } catch (error) {
      wx.showModal({ title: "生成失败", content: error.message, showCancel: false });
    }
  },

  async pollTask(taskId) {
    const timer = setInterval(async () => {
      const response = await request({ url: `/api/tryon/${taskId}` });
      setTask(response.task);
      if (response.task.generationStatus === "succeeded") {
        clearInterval(timer);
        wx.redirectTo({ url: "/pages/result/result" });
      }
      if (response.task.generationStatus === "failed") {
        clearInterval(timer);
        wx.showModal({ title: "生成失败", content: response.task.failureReason, showCancel: false });
      }
    }, 1500);
  },
});
```

Create `miniprogram/pages/generating/generating.wxml`:

```xml
<view class="page generating">
  <view class="loader"></view>
  <text class="serif-title title">正在生成</text>
  <text class="secondary-text copy">{{statusText}}</text>

  <view class="steps">
    <view>锁定本人相似度</view>
    <view>调整肩宽、腰线和裙摆</view>
    <view>保留礼服材质与拖尾</view>
    <view>自然轻美化</view>
  </view>
</view>
```

Create `miniprogram/pages/generating/generating.wxss`:

```css
.generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.loader {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 8rpx solid #eadfd4;
  border-top-color: #9b7b52;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.title {
  font-size: 50rpx;
}

.copy {
  font-size: 27rpx;
}

.steps {
  width: 100%;
  display: grid;
  gap: 14rpx;
  margin-top: 28rpx;
}

.steps view {
  padding: 24rpx;
  border-radius: 22rpx;
  background: #ffffff;
  color: #5f554b;
}
```

- [ ] **Step 3: Create result page with non-overlapping title**

Create `miniprogram/pages/result/result.js`:

```js
import { getTryOnState, resetTryOnState } from "../../utils/tryonState";

Page({
  data: {
    task: null,
    dress: null,
  },

  onLoad() {
    const state = getTryOnState();
    this.setData({
      task: state.task,
      dress: state.dress,
    });
  },

  restart() {
    resetTryOnState();
    wx.reLaunch({ url: "/pages/home/home" });
  },
});
```

Create `miniprogram/pages/result/result.wxml`:

```xml
<view class="result-page">
  <view class="result-title">
    <text class="serif-title title">试穿效果</text>
    <text class="meta">{{dress.code}} · {{dress.name}}</text>
  </view>

  <view class="image-wrap">
    <image wx:if="{{task.resultImage}}" class="result-image" src="{{task.resultImage}}" mode="aspectFit" />
    <view wx:else class="empty-image">暂无结果图</view>
  </view>

  <view class="actions">
    <view class="primary-button">保存并咨询</view>
    <view class="ghost-button" bindtap="restart">重新试穿</view>
  </view>
</view>
```

Create `miniprogram/pages/result/result.wxss`:

```css
.result-page {
  min-height: 100vh;
  background: #fbfaf7;
  display: flex;
  flex-direction: column;
}

.result-title {
  flex: 0 0 auto;
  padding: 24rpx 32rpx 20rpx;
  background: #fbfaf7;
  border-bottom: 1rpx solid #eee4da;
}

.title {
  display: block;
  font-size: 50rpx;
  line-height: 1.1;
}

.meta {
  display: block;
  margin-top: 8rpx;
  color: #6b6056;
  font-size: 25rpx;
}

.image-wrap {
  flex: 1 1 auto;
  min-height: 0;
  background: #eee4da;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-image {
  width: 100%;
  height: 100%;
}

.empty-image {
  color: #74695e;
}

.actions {
  flex: 0 0 auto;
  padding: 22rpx 32rpx 34rpx;
  display: grid;
  gap: 16rpx;
  background: #fbfaf7;
}

.ghost-button {
  height: 84rpx;
  border-radius: 999rpx;
  border: 1rpx solid #d8c7b2;
  color: #5f554b;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 4: Verify full Mini Program mock flow**

Run backend in mock mode:

```bash
OPENAI_MOCK=true npm --prefix server run dev
```

In WeChat DevTools:

- Start from Home.
- Upload one image.
- Skip body info.
- Pick `缎面 A 字主纱`.
- Wait for generation.
- Result page shows a full image area.
- Title and dress code are above the image and do not cover the person.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/dresses miniprogram/pages/generating miniprogram/pages/result
git commit -m "feat: add dress selection and result flow"
```

## Task 8: Add Live OpenAI Configuration and Final Verification

**Files:**
- Create: `README.md`
- Modify: `server/src/lib/openaiImageClient.js`
- Test: `server/tests/tryon.routes.test.js`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
# 婚纱礼服 AI 试穿小程序

顾客端 MVP：上传本人照片，填写可选体型信息，选择婚纱礼服，生成试穿效果图。

## 本地启动

安装后端依赖：

```bash
npm run server:install
```

复制环境变量：

```bash
cp .env.example server/.env
```

默认使用 mock 生成，不消耗 OpenAI API：

```bash
OPENAI_MOCK=true npm run server:dev
```

健康检查：

```bash
curl http://localhost:8787/health
```

## 接入 OpenAI

在 `server/.env` 中设置：

```bash
OPENAI_API_KEY=你的本地环境变量
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_MOCK=false
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787
```

不要把 API Key 写入前端，也不要提交 `.env`。

## 小程序预览

用微信开发者工具打开：

```text
D:\婚纱试穿小程序\miniprogram
```

开发阶段需要关闭 URL 校验，或把本地后端配置到合法域名后再真机测试。

## MVP 验收

- 上传页支持 1-3 张本人照的界面。
- 体型信息可跳过。
- 礼服选择有 4 个种子款式。
- 生成页显示处理状态。
- 结果页整版展示图片，文字不遮挡人物主体。
```

- [ ] **Step 2: Keep OpenAI stream handles closed**

Modify `server/src/lib/openaiImageClient.js` so live file streams are closed after the API call:

```js
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { getConfig } from "../config.js";

const MOCK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#fbfaf7"/>
  <circle cx="512" cy="190" r="86" fill="#c9a987"/>
  <path d="M310 360 C360 290 664 290 714 360 L812 1380 H212 Z" fill="#ffffff" stroke="#e5d8c8" stroke-width="8"/>
  <path d="M412 340 L512 600 L612 340" fill="none" stroke="#d0b28a" stroke-width="10"/>
  <ellipse cx="512" cy="1220" rx="365" ry="210" fill="#ffffff" opacity="0.9"/>
</svg>`;

export async function generateTryOnImage({ prompt, imagePaths, taskId }) {
  const config = getConfig();
  const outputDir = path.resolve("server/generated");
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
```

- [ ] **Step 3: Run all backend tests**

Run:

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 4: Run mock end-to-end smoke test**

Run backend:

```bash
OPENAI_MOCK=true npm --prefix server run dev
```

Run upload smoke test:

```bash
curl -F "dressId=dress-satin-a-line" -F "height=165" -F "customerImages=@docs/superpowers/specs/2026-06-21-wedding-dress-ai-tryon-design.md;filename=front.png" http://localhost:8787/api/tryon
```

Expected: response includes a `tryon_` task id and `generationStatus` is `processing`.

- [ ] **Step 5: Verify Mini Program in WeChat DevTools**

Expected:

- Full customer flow works with mock backend.
- Result image area is full-screen between title and actions.
- Text never overlays the generated person.
- Upload and generation errors are understandable.

- [ ] **Step 6: Commit**

```bash
git add README.md server/src/lib/openaiImageClient.js
git commit -m "docs: add runbook and live OpenAI configuration"
```

## Self-Review Checklist

- Spec coverage:
  - 1-3 customer images: covered in upload page and backend multipart route.
  - Optional body info: covered in body page and prompt builder.
  - Dress selection: covered with seeded MVP dress data.
  - OpenAI image editing route: covered in backend adapter.
  - Body-aware fitting: covered in prompt builder and generation state copy.
  - Result page full-screen and non-overlapping title: covered in result page layout.
  - Error handling: covered in upload validation, task polling, and route errors.

- Placeholder scan:
  - Plan contains no unresolved placeholder markers.
  - Every file listed in the MVP path has concrete content or a concrete verification command.

- Type consistency:
  - `dressId`, `bodyInfo`, `generationStatus`, `resultImage`, and `failureReason` are consistent across Mini Program state, backend store, and tests.

## Execution Options

After this plan is accepted, implement it task-by-task using one of these approaches:

1. Subagent-Driven: dispatch a fresh subagent per task, review between tasks, faster iteration.
2. Inline Execution: execute tasks in this session using checkpoints after each task.
