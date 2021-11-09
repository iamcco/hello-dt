export function toBlackWhiteBase64(canvas: HTMLCanvasElement) {
  // const ctx = canvas.getContext("2d")!;
  // const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // for (let idx = 0; idx < image.data.length; idx += 4) {
  //   const d = image.data;
  //   if (d[idx] < 255 / 2 && d[idx + 1] < 255 / 2 && d[idx + 2] < 255 / 2) {
  //     d[idx] = 0;
  //     d[idx + 1] = 0;
  //     d[idx + 2] = 0;
  //   }
  // }
  // ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png", 0.9).split(",").pop()!;
}
