import { OlaMaps } from "olamaps-web-sdk";

// Export factory functions instead of instances
export const createOlaMaps = () => new OlaMaps({
  apiKey: import.meta.env.VITE_OLA_API_KEY,
});

export const createOlaMaps3D = () => new OlaMaps({
  apiKey: import.meta.env.VITE_OLA_API_KEY,
  mode: "3d",
  threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
});