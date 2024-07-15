import { Settings } from "@/state/settings";
import {
  createClientFromSettings,
  getBestModel,
  getCheapestModel,
} from "./client";
import {
  ChatCompletion,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/index.mjs";
import { traced } from "braintrust";
import { User } from "@supabase/supabase-js";
import {
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions.mjs";
import { Stream } from "openai/streaming.mjs";

type NonStreamingParams = Omit<ChatCompletionCreateParamsNonStreaming, "model">;
type StreamingParams = Omit<ChatCompletionCreateParamsStreaming, "model">;

export async function createCompletion(params: {
  settings: Settings;
  label: string;
  forceModel?: Settings["model"];
  body: NonStreamingParams;
  user: User | null;
}): Promise<ChatCompletion>;
export async function createCompletion(params: {
  settings: Settings;
  label: string;
  forceModel?: Settings["model"];
  body: StreamingParams;
  user: User | null;
}): Promise<Stream<ChatCompletionChunk>>;
export async function createCompletion({
  settings,
  label,
  forceModel,
  body,
  user,
}: {
  settings: Settings;
  label: string;
  forceModel?: Settings["model"];
  body: NonStreamingParams | StreamingParams;
  user: User | null;
}): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
  return await traced(async (span) => {
    const { client, preferredModel, mode } = createClientFromSettings(settings);
    span.log({
      metadata: {
        label,
        userID: user?.id,
      },
    });
    const model =
      forceModel === "cheap"
        ? getCheapestModel(mode)
        : forceModel === "best"
        ? getBestModel(mode)
        : preferredModel;
    return await client.chat.completions.create({
      ...body,
      model,
    });
  });
}
