import filters from "imagedata-filters";

export function imageFilter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

  filters.grayscale(image, { amount: 1 });
  ctx.putImageData(image, 0, 0);
  return canvas;
}
