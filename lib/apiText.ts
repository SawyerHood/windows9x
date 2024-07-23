export const getApiText = (keys: string[]) => `\`\`\`typescript
declare global {
  // Chat lets you use an LLM to generate a response. 
  // Note that a call to assistant must always come after a call to user.
  var chat: (messages: { role: "user" | "assistant" | "system"; content: string }[]) => Promise<string>;
  var registry: Registry;

  // If the application supports saving and opening files, register a callback to be called when the user saves/opens the file.
  // The format of the file is any plain text format that your application can read. If these are registered the OS will create
  // the file picker for you. The operating system will create the file menu for you.

  // The callback should return the new content of the file
  // Used like this:
  // registerOnSave(() => {
  //   return "new content";
  // });
  var registerOnSave: (callback: () => string) => void;

  // Register a callback to be called when the user opens the file
  // The callback should return the content of the file
  // Used like this:
  // registerOnOpen((content) => {
  //   console.log(content);
  // });
  var registerOnOpen: (callback: (content: string) => void) => void;

  // Spawn a new program with the given description and optional dataUrl for an image to help with making the program
  // Returns a promise that resolves when the program has been spawned. 
  // Include the mime type in the base64 image.
  var spawn: (description: string, dataUrl?: string) => Promise<string>;
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
