import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { Page } from "./types";

export const MAX_PAGES = 5;

// The server host rejects uploads over about 4.5 MB in total, so keep PDFs
// under 4 MB and shrink photos to roughly 300-600 KB each.
const MAX_PDF_BYTES = 4 * 1024 * 1024;

export class PageError extends Error {}

// Phone photos are often 5-15 MB (and sometimes HEIC). Shrink every photo to a
// small JPEG that is still sharp enough to read.
async function toJpeg(uri: string, width: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (width > 1600) context.resize({ width: 1600 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
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
  const tooBig = result.assets.find((a) => (a.size ?? 0) > MAX_PDF_BYTES);
  if (tooBig) {
    const mb = ((tooBig.size ?? 0) / 1024 / 1024).toFixed(1);
    throw new PageError(
      `That PDF is ${mb} MB, and the limit is 4 MB. Try "Take a photo" of the pages instead, or a smaller scan.`,
    );
  }
  return result.assets.map((a) => ({ uri: a.uri, name: a.name || "document.pdf", mimeType: "application/pdf" as const }));
}
