export const getApiText = (keys: string[]) => `\`\`\`typescript
declare global {
  // Chat lets you use an LLM to generate a response. If returnJson is true, the response will be in JSON format.
  var chat: (messages: { role: "user" | "assistant" | "system"; content: string }[], returnJson?: boolean) => Promise<string>;
  var registry: Registry;
}

// Uses for the registry:
// - To store user settings
// - To store user data
// - To store user state
// - Interact with the operating system.
//
// If the key can be written by other apps, it should be prefixed with "public_"
//
// You can define your own registry keys or use one of these known keys:
${keys.map((key) => `// ${key}`).join("\n")}
interface Registry {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}\`\`\``;
