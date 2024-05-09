import { initLogger, wrapOpenAI } from "braintrust";
import OpenAI from "openai";

const MODE: "openrouter" | "braintrust" | "groq" = "braintrust" as const;

const getModel = (mode: "openrouter" | "braintrust" | "groq") => {
  switch (mode) {
    case "braintrust":
      return "claude-3-opus-20240229";
    case "openrouter":
      return "fireworks/mixtral-8x22b-instruct-preview";
    case "groq":
      return "llama3-70b-8192";
  }
};

const getCheapModel = (mode: "openrouter" | "braintrust" | "groq") => {
  switch (mode) {
    case "openrouter":
      return "fireworks/mixtral-8x22b-instruct-preview";
    case "braintrust":
      return "claude-3-haiku-20240307";
    case "groq":
      return "llama3-8b-8192";
  }
};

const createClient = (mode: "openrouter" | "braintrust" | "groq") => {
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
  }
};

export const MODEL = getModel(MODE);

export const CHEAP_MODEL = getCheapModel(MODE);
const logger = initLogger({
  projectName: "windows96",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export const openai = wrapOpenAI(createClient(MODE));
