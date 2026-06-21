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
