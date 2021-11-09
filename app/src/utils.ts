import filters from "imagedata-filters";

export function toBlackWhiteBase64(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

  filters.contrast(image, { amount: 1.2 });
  filters.grayscale(image, { amount: 1 });
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png", 0.9).split(",").pop()!;
}
