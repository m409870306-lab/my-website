import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("dress management routes", () => {
  it("creates an uploaded dress and returns it in the active dress list", async () => {
    const app = createApp();

    const created = await request(app)
      .post("/api/dresses")
      .field("code", "W-2001")
      .field("name", "测试上传缎面主纱")
      .field("category", "主纱")
      .field("silhouette", "A-line")
      .field("fabric", "ivory satin")
      .field("neckline", "square neck")
      .field("sleeve", "sleeveless")
      .field("train", "chapel train")
      .attach("dressImage", Buffer.from("fake dress image"), "dress.png");

    expect(created.status).toBe(201);
    expect(created.body.dress.id).toMatch(/^dress_/);
    expect(created.body.dress.code).toBe("W-2001");
    expect(created.body.dress.imageUrl).toMatch(/^\/dress-images\//);

    const listed = await request(app).get("/api/dresses");
    expect(listed.body.dresses.some((dress) => dress.id === created.body.dress.id)).toBe(true);
  });

  it("uses an uploaded dress as the garment reference for a try-on task", async () => {
    const app = createApp();

    const created = await request(app)
      .post("/api/dresses")
      .field("code", "W-2002")
      .field("name", "测试蕾丝鱼尾")
      .attach("dressImage", Buffer.from("fake dress image"), "dress.png");

    const response = await request(app)
      .post("/api/tryon")
      .field("dressId", created.body.dress.id)
      .attach("customerImages", Buffer.from("fake customer image"), "front.png");

    expect(response.status).toBe(201);
    expect(response.body.task.dressImage).toBe(created.body.dress.imageUrl);
    expect(response.body.task.generationStatus).toBe("processing");
  });

  it("rejects dress creation without an image", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/dresses")
      .field("code", "W-2003")
      .field("name", "无图礼服");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("请上传礼服图片");
  });
});
