import { OlaMaps } from "olamaps-web-sdk";

export const olaMaps = new OlaMaps({
    apiKey: import.meta.env.VITE_OLA_API_KEY,
});
export const olaMaps3D = new OlaMaps({
    apiKey: import.meta.env.VITE_OLA_API_KEY,
    mode: "3d",
    threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
  })