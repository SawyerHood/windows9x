import { initLogger, wrapOpenAI } from "braintrust";
import OpenAI from "openai";

type Provider = "openrouter" | "braintrust" | "groq" | "openai";
const MODE: Provider = "braintrust" as const;

const getModel = (mode: Provider) => {
  switch (mode) {
    case "braintrust":
      return "claude-3-5-sonnet-20240620";
    case "openrouter":
      return "fireworks/mixtral-8x22b-instruct-preview";
    case "groq":
      return "llama3-70b-8192";
    case "openai":
      return "gpt-4o";
  }
};

const getCheapModel = (mode: Provider) => {
  switch (mode) {
    case "openrouter":
      return "fireworks/mixtral-8x22b-instruct-preview";
    case "braintrust":
      return "claude-3-haiku-20240307";
    case "groq":
      return "llama3-8b-8192";
    case "openai":
      return "gpt-3.5-turbo";
  }
};

const createClient = (mode: Provider) => {
  switch (mode) {
    case "openrouter":
      return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPEN_ROUTER_KEY,
      });
    case "braintrust":
      return new OpenAI({
        baseURL: "https://braintrustproxy.com/v1",
        apiKey: process.env.BRAINTRUST_API_KEY,
      });
    case "groq":
      return new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
    case "openai":
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
  }
};

export const MODEL = getModel(MODE);

export const CHEAP_MODEL = getCheapModel(MODE);

initLogger({
  projectName: "windows96",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export const openai = wrapOpenAI(createClient(MODE));
