import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type ProxyOptions } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const proxy: Record<string, ProxyOptions> = {
  "/api": {
    target: process.env.API_URL ?? "http://localhost:3000",
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { proxy },
  preview: { proxy },
});
