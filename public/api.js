// iframe/api.ts
class Registry {
  currId = 0;
  async get(key) {
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
  async set(key, value) {
    const id = this.currId++;
    window.parent.postMessage({ operation: "set", key, value, id }, "*");
  }
  async delete(key) {
    const id = this.currId++;
    window.parent.postMessage({ operation: "delete", key, id }, "*");
  }
  async listKeys() {
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
window.registry = new Registry;
