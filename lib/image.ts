export type CropArea = { x: number; y: number; width: number; height: number };

const MAX_BYTES = 200_000; // A7: ≤200KB out

/**
 * Draw the cropped region of an image onto a square canvas and export WebP.
 * Steps quality down until it fits the ≤200KB budget.
 */
export async function cropToWebp(
  imageSrc: string,
  crop: CropArea,
  size = 1000,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

  let q = quality;
  let blob = await toBlob(canvas, q);
  while (blob.size > MAX_BYTES && q > 0.4) {
    q -= 0.12;
    blob = await toBlob(canvas, q);
  }
  return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image export failed"))),
      "image/webp",
      quality,
    );
  });
}
