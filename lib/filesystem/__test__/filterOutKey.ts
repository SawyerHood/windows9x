// Helper function to recursively filter out a key from all objects
export function filterOutKey(obj: any, keyToFilter: string): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterOutKey(item, keyToFilter));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (key !== keyToFilter) {
      acc[key] = filterOutKey(value, keyToFilter);
    }
    return acc;
  }, {} as any);
}
