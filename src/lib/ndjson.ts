/** Feeds text chunks in, calls back once per complete JSON line. Handles lines split across chunks. */
export function createLineParser<T>(onItem: (item: T) => void) {
  let buffer = "";
  return {
    push(chunk: string) {
      buffer += chunk;
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) onItem(JSON.parse(line) as T);
        index = buffer.indexOf("\n");
      }
    },
    flush() {
      const line = buffer.trim();
      buffer = "";
      if (line) onItem(JSON.parse(line) as T);
    },
  };
}
