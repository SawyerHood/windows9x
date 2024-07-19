export async function waitForElement(
  id: string,
  timeout = 5000
): Promise<HTMLElement | null> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function checkElement() {
      const element = document.getElementById(id);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for element with id: ${id}`));
      } else {
        requestAnimationFrame(checkElement);
      }
    }

    requestAnimationFrame(checkElement);
  });
}
