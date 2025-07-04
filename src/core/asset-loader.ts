import { readFile } from "fs/promises";
import { join } from "path";
import config from "./config";

const ASSETS_PATH = join(process.cwd(), "src", "static", "assets");

// Helper function to get asset URLs from CloudFront/CDN
function getAssetUrl(filename: string): string {
  if (config.app.assetsUrl) {
    return `${config.app.assetsUrl}/${filename}`;
  }
  // Fallback for local development
  return `/assets/${filename}`;
}

async function loadAsset(filename: string): Promise<string> {
  try {
    const filePath = join(ASSETS_PATH, filename);
    return await readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error loading asset: ${filename}`, error);
    return "";
  }
}

async function loadAssets(filenames: string[]): Promise<string[]> {
  return Promise.all(filenames.map(loadAsset));
}

const assetCache = new Map<string, string>();

async function loadAssetCached(filename: string): Promise<string> {
  if (assetCache.has(filename)) {
    return assetCache.get(filename)!;
  }

  const content = await loadAsset(filename);
  assetCache.set(filename, content);
  return content;
}

export { loadAsset, loadAssets, loadAssetCached, getAssetUrl };
