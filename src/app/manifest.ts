import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TerraPin",
    short_name: "TerraPin",
    description: "A premium geography guessing game",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0d1a",
    theme_color: "#0f0d1a",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
