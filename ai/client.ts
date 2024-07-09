import type { Settings } from "@/state/settings";
import { initLogger, wrapOpenAI } from "braintrust";
import OpenAI from "openai";

type Provider = "openrouter" | "braintrust" | "openai" | "anthropic";
const DEFAULT_MODE: Provider = process.env.BRAINTRUST_API_KEY
  ? "braintrust"
  : process.env.ANTHROPIC_API_KEY
  ? "anthropic"
  : process.env.OPEN_ROUTER_KEY
  ? "openrouter"
  : process.env.OPENAI_API_KEY
  ? "openai"
  : "openai"; // Default to OpenAI if no key is found

export const getBestModel = (mode: Provider) => {
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

export const getCheapestModel = (mode: Provider) => {
  switch (mode) {
    case "anthropic":
    case "braintrust":
      return "claude-3-haiku-20240307";

    case "openrouter":
      return "anthropic/claude-3-haiku";
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

if (!process.env.LOCAL_MODE) {
  initLogger({
    projectName: "windows96",
    apiKey: process.env.BRAINTRUST_API_KEY,
  });
}

function maybeWrapOpenAI(client: OpenAI): OpenAI {
  if (process.env.LOCAL_MODE) {
    return client;
  }
  return wrapOpenAI(client);
}

export const getDefaultClient = () => createClient(DEFAULT_MODE);

export function createClientFromSettings(settings: Settings): {
  mode: Provider;
  client: OpenAI;
  usedOwnKey: boolean;
  preferredModel: string;
} {
  if (!settings.apiKey) {
    return {
      mode: DEFAULT_MODE,
      client: maybeWrapOpenAI(getDefaultClient()),
      usedOwnKey: false,
      preferredModel:
        settings.model === "cheap"
          ? getCheapestModel(DEFAULT_MODE)
          : getBestModel(DEFAULT_MODE),
    };
  }
  const client = getClientFromKey(settings.apiKey);
  return {
    ...client,
    client: maybeWrapOpenAI(getClientFromKey(settings.apiKey).client),
    usedOwnKey: true,
    preferredModel:
      settings.model === "cheap"
        ? getCheapestModel(client.mode)
        : getBestModel(client.mode),
  };
}
