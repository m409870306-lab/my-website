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
  ].join("\n");
}
