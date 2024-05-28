class Registry {
  currId: number = 0;

  async get(key: string): Promise<any> {
    const id = this.currId++;
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
    const id = this.currId++;
    window.parent.postMessage({ operation: "set", key, value, id }, "*");
  }

  async delete(key: string): Promise<void> {
    const id = this.currId++;
    window.parent.postMessage({ operation: "delete", key, id }, "*");
  }

  async listKeys(): Promise<string[]> {
    const id = this.currId++;
    window.parent.postMessage({ operation: "listKeys", id }, "*");
    return new Promise((resolve, reject) => {
      window.addEventListener("message", (event) => {
        if (event.data.id === id) {
          resolve(event.data.keys);
        }
      });
    });
  }
}

(window as any).registry = new Registry();
