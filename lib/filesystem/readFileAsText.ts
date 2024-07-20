export async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}
