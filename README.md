# Windows9x

Windows9X is the operating system of future's past. What if Windows 98 could generate any application that you wanted on the fly? You enter the description of a program you want inside of the run dialog and the OS creates that for you on the fly.

https://github.com/SawyerHood/windows9x/assets/2380669/19c91f20-cdf5-47f9-b6fc-b7a606b9d7b3

## Getting started

1. Install [bun](https://bun.sh/docs/installation)
2. Run `bun install`
3. Run `bun run dev`
4. Navigate to `http://localhost:3000`

## How does this work?

When you enter a description of an application, an LLM is prompted to generate an HTML file that looks like a windows 98 application. This is done by injecting 98.css into the page as we stream in the result. This is rendered inside of an iframe that is rendered inside of a window.

In addition applications have access to a limited OS API that allows for saving/reading files, reading/writing from the registry, and prompting an LLM.

## OS API

This is the api that applications have access to in case it helps with prompting:

```typescript
declare global {
  // Chat lets you use an LLM to generate a response.
  var chat: (
    messages: { role: "user" | "assistant" | "system"; content: string }[]
  ) => Promise<string>;
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
}

// Uses for the registry:
// - To store user settings
// - To store user data
// - To store user state
// - Interact with the operating system.
//
// If the key can be written by other apps, it should be prefixed with "public_"
interface Registry {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}
```

## Thanks

I want to thank the following people:

- [Scratch](https://x.com/DrBriefsScratch) - Inspired me by getting Windows 98 to run inside of a VM inside of Websim.
- [Nate](https://x.com/nateparrott) - Nate and I independently started building the same project. Nate gave me the idea of "chatting with the developer" to change the program.
- [Jordan](https://x.com/jdan) - Make 98.css which is the basis that makes this look like Windows 98.

## Demos

Here are a few examples of applications that can be created:

> Everything in Windows9X is a file you can generate a program to generate another program

https://github.com/SawyerHood/windows9x/assets/2380669/cb6f5189-9276-4526-a517-7d84b3331ba7

> Here is an example of an application that is generated that in turn can generate websites.

https://github.com/SawyerHood/windows9x/assets/2380669/7a9a0a32-d52d-4901-8f33-d7e148e8bee3

> Creating a natural language SQL prompter

https://github.com/SawyerHood/windows9x/assets/2380669/ab404aa7-7018-4d07-96b4-4678ca388d10
