import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { Page } from "./types";

export const MAX_PAGES = 5;

// Phone photos are often 5-15 MB (and sometimes HEIC). Shrink every photo to a
// readable JPEG well under the server's 5 MB limit.
async function toJpeg(uri: string, width: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (width > 2000) context.resize({ width: 2000 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return saved.uri;
}

async function fromImageResult(result: ImagePicker.ImagePickerResult): Promise<Page[]> {
  if (result.canceled) return [];
  return Promise.all(
    result.assets.map(async (asset, i) => ({
      uri: await toJpeg(asset.uri, asset.width),
      name: `page-${Date.now()}-${i}.jpg`,
      mimeType: "image/jpeg" as const,
    })),
  );
}

export async function takePhoto(): Promise<Page[] | "denied"> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return "denied";
  return fromImageResult(await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 }));
}

export async function choosePhotos(limit: number): Promise<Page[]> {
  return fromImageResult(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 1,
    }),
  );
}

export async function choosePdf(): Promise<Page[]> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, name: a.name || "document.pdf", mimeType: "application/pdf" as const }));
}
