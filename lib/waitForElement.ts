export async function waitForElement(id: string, timeout = 5000) {
  return new Promise<HTMLElement | null>((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.getElementById(id);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for element with id: ${id}`));
      }
    }, 100);
  });
}
