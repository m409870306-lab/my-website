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
