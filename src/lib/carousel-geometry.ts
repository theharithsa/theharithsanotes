export function photoScrollOffset(
  offsets: number[],
  index: number,
  maximum: number,
): number {
  return Math.max(
    0,
    Math.min(
      offsets[Math.max(0, Math.min(index, offsets.length - 1))] ?? 0,
      maximum,
    ),
  );
}
export function nearestPhotoIndex(
  offsets: number[],
  left: number,
  maximum: number,
): number {
  if (maximum > 1 && left >= maximum - 2)
    return Math.max(0, offsets.length - 1);
  return offsets.reduce(
    (best, offset, index) =>
      Math.abs(offset - left) < Math.abs((offsets[best] ?? 0) - left)
        ? index
        : best,
    0,
  );
}
