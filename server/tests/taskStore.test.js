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
