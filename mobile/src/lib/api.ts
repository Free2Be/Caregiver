import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import type { ExplainResult, Page } from "./types";

// Set these when building: see mobile/README.md.
const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
const APP_KEY = (process.env.EXPO_PUBLIC_APP_KEY || "").trim();

const DEVICE_ID_KEY = "device-id";

// A random ID for this install, used for the server's per-phone daily limit.
async function deviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function appendPage(form: FormData, page: Page) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(page.uri)).blob();
    form.append("files", blob, page.name);
  } else {
    // Expo's fetch doesn't accept React Native's { uri } file parts. It takes an
    // object with a name, a type, and a bytes() reader, and sends those as the
    // part's filename, content type, and contents.
    const bytes = new Uint8Array(await new File(page.uri).arrayBuffer());
    const part = { name: page.name, type: page.mimeType, bytes: async () => bytes };
    form.append("files", part as unknown as Blob);
  }
}

export async function explain(pages: Page[], question: string): Promise<ExplainResult> {
  const form = new FormData();
  for (const page of pages) await appendPage(form, page);
  form.append("question", question);

  // Android refuses to send a header containing emoji, curly quotes and the like,
  // which looks like a connection failure. Say so plainly instead.
  if (!/^[\x21-\x7e]*$/.test(APP_KEY)) {
    throw new Error("This build's app key has unsupported characters. Use only letters and numbers for APP_KEY, then rebuild.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/explain`, {
      method: "POST",
      body: form,
      headers: { "x-device-id": await deviceId(), ...(APP_KEY ? { "x-app-key": APP_KEY } : {}) },
    });
  } catch (e) {
    const detail = e instanceof Error ? ` (${e.message})` : "";
    // Tell "no internet" apart from "the upload itself failed".
    const online = await fetch(`${API_URL}/api/health`).then((r) => r.ok, () => false);
    throw new Error(
      online
        ? `The upload didn't go through. The pages may be too large: try fewer pages, or photos instead of a PDF.${detail}`
        : `Couldn't connect. Check your internet connection and try again.${detail}`,
    );
  }
  if (res.status === 413) {
    throw new Error("Those pages are too large to send. Try fewer pages, or photos instead of a PDF.");
  }

  let data: { error?: string } & Partial<ExplainResult>;
  try {
    data = await res.json();
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
  if (!res.ok || !data.explanation) throw new Error(data.error || "Something went wrong. Please try again.");
  return { explanation: data.explanation, demo: data.demo };
}
