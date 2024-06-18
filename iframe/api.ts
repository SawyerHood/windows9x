let currId = 0;

class Registry {
  async get(key: string): Promise<any> {
    const id = currId++;
    window.parent.postMessage({ operation: "get", key, id }, "*");
    return new Promise((resolve, reject) => {
      window.addEventListener("message", (event) => {
        console.log("message", event.data);
        if (event.data.id === id) {
          resolve(event.data.value);
        }
      });
    });
  }
  async set(key: string, value: any): Promise<void> {
    const id = currId++;
    window.parent.postMessage({ operation: "set", key, value, id }, "*");
  }

  async delete(key: string): Promise<void> {
    const id = currId++;
    window.parent.postMessage({ operation: "delete", key, id }, "*");
  }

  async listKeys(): Promise<string[]> {
    const id = currId++;
    window.parent.postMessage({ operation: "listKeys", id }, "*");
    return new Promise((resolve, reject) => {
      window.addEventListener("message", (event) => {
        if (event.data.id === id) {
          resolve(event.data.value);
        }
      });
    });
  }
}

(window as any).chat = (messages: any[], returnJson?: boolean) => {
  const id = currId++;
  window.parent.postMessage(
    { operation: "chat", value: messages, id, returnJson },
    "*"
  );
  return new Promise((resolve, reject) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.id === id) {
        window.removeEventListener("message", messageHandler);
        resolve(event.data.value);
      }
    };
    window.addEventListener("message", messageHandler);
  });
};

let onSaveCallback: (() => string) | null = null;
(window as any).registerOnSave = (callback: () => string) => {
  onSaveCallback = callback;
  window.parent.postMessage({ operation: "registerOnSave" }, "*");
};

let onOpenCallback: ((content: string) => void) | null = null;
(window as any).registerOnOpen = (callback: (content: string) => void) => {
  onOpenCallback = callback;
  window.parent.postMessage({ operation: "registerOnOpen" }, "*");
};

window.onmessage = (event) => {
  if (event.data.operation === "save") {
    const content = onSaveCallback?.();
    if (content) {
      window.parent.postMessage({ operation: "saveComplete", content }, "*");
    }
  }

  if (event.data.operation === "open") {
    const content = event.data.content;
    onOpenCallback?.(content);
  }
};

(window as any).registry = new Registry();
