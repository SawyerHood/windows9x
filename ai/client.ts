// import { initLogger, wrapOpenAI } from "braintrust";
import OpenAI from "openai";

type Provider = "openrouter" | "braintrust" | "openai" | "anthropic";
const MODE: Provider = process.env.BRAINTRUST_API_KEY
  ? "braintrust"
  : process.env.ANTHROPIC_API_KEY
  ? "anthropic"
  : process.env.OPEN_ROUTER_KEY
  ? "openrouter"
  : process.env.OPENAI_API_KEY
  ? "openai"
  : "openai"; // Default to OpenAI if no key is found

export const getModel = (mode: Provider) => {
  switch (mode) {
    case "anthropic":
    case "braintrust":
      return "claude-3-5-sonnet-20240620";
    case "openrouter":
      return "anthropic/claude-3.5-sonnet";
    case "openai":
      return "gpt-4o";
  }
};

const createClient = (mode: Provider) => {
  switch (mode) {
    case "openrouter":
      return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPEN_ROUTER_KEY,
      });
    case "anthropic":
      return new OpenAI({
        baseURL: "https://braintrustproxy.com/v1",
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    case "braintrust":
      return new OpenAI({
        baseURL: "https://braintrustproxy.com/v1",
        apiKey: process.env.BRAINTRUST_API_KEY,
      });
    case "openai":
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
  }
};

export function getClientFromKey(apiKey: string): {
  mode: Provider;
  client: OpenAI;
} {
  if (apiKey.startsWith("sk-or")) {
    return {
      mode: "openrouter",
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      }),
    };
  }
  return {
    mode: "braintrust",
    client: new OpenAI({
      apiKey,
      baseURL: "https://braintrustproxy.com/v1",
    }),
  };
}

export const DEFAULT_MODEL = getModel(MODE);

// initLogger({
//   projectName: "windows96",
//   apiKey: process.env.BRAINTRUST_API_KEY,
// });

// export const openai = wrapOpenAI(createClient(MODE));

export const defaultClient = createClient(MODE);
