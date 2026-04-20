// vite.spa.config.ts
// Standalone SPA build config for static deployment (e.g., Vercel, Netlify).
// Bypasses TanStack Start SSR and Cloudflare Worker pipeline entirely.
// Uses @tanstack/router-plugin for file-based routing (client-side only).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      tailwindcss(),
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
      tsconfigPaths(),
    ],
    define: {
      // Inject VITE_ env vars so they work in static builds
      ...Object.fromEntries(
        Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },
    build: {
      outDir: "dist-spa",
      emptyOutDir: true,
      rollupOptions: {
        input: "index.spa.html",
      },
    },
  };
});
