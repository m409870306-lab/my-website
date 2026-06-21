import { randomUUID } from "node:crypto";
import { dresses as seededDresses } from "../data/dresses.js";

const customDresses = [];

export function listActiveDresses() {
  return [...seededDresses, ...customDresses].filter((dress) => dress.isActive);
}

export function findActiveDress(id) {
  return listActiveDresses().find((dress) => dress.id === id) || null;
}

export function createDress(input) {
  const dress = {
    id: `dress_${randomUUID()}`,
    code: input.code || `W-${Date.now()}`,
    name: input.name || "未命名礼服",
    imageUrl: input.imageUrl,
    imagePath: input.imagePath,
    category: input.category || "主纱",
    silhouette: input.silhouette || "custom",
    fabric: input.fabric || "unknown",
    neckline: input.neckline || "custom",
    sleeve: input.sleeve || "custom",
    train: input.train || "custom",
    isActive: true,
  };
  customDresses.push(dress);
  return dress;
}
