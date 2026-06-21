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
