import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import type { ExplainResult, Page } from "./types";

// Set these when building: see mobile/README.md.
const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
const APP_KEY = process.env.EXPO_PUBLIC_APP_KEY || "";

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
    // React Native's FormData accepts a file reference by URI.
    form.append("files", { uri: page.uri, name: page.name, type: page.mimeType } as unknown as Blob);
  }
}

export async function explain(pages: Page[], question: string): Promise<ExplainResult> {
  const form = new FormData();
  for (const page of pages) await appendPage(form, page);
  form.append("question", question);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/explain`, {
      method: "POST",
      body: form,
      headers: { "x-device-id": await deviceId(), ...(APP_KEY ? { "x-app-key": APP_KEY } : {}) },
    });
  } catch {
    throw new Error("Couldn't connect. Check your internet connection and try again.");
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
