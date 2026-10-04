const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });

export function countWords(text: string): number {
  let count = 0;
  for (const part of segmenter.segment(text)) {
    if (part.isWordLike) count++;
  }
  return count;
}
