// iframe/api.ts
var currId = 0;

class Registry {
  async get(key) {
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
  async set(key, value) {
    const id = currId++;
    window.parent.postMessage({ operation: "set", key, value, id }, "*");
  }
  async delete(key) {
    const id = currId++;
    window.parent.postMessage({ operation: "delete", key, id }, "*");
  }
  async listKeys() {
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
window.chat = (messages, returnJson) => {
  const id = currId++;
  window.parent.postMessage({ operation: "chat", value: messages, id, returnJson }, "*");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", (event) => {
      if (event.data.id === id) {
        resolve(event.data.value);
      }
    });
  });
};
window.registry = new Registry;
