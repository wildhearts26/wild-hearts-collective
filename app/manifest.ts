import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wild Hearts Collective",
    short_name: "Wild Hearts",
    description:
      "Inclusive aerial and pole studio in Mansfield offering pole, hoop, silks, and creative arts.",
    start_url: "/",
    display: "browser",
    background_color: "#f7f4ef",
    theme_color: "#ebe4da",
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
