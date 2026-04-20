// src/main.spa.tsx
// Client-side only entrypoint for static/SPA deployments (Vercel, Netlify, etc.)
// This bypasses the TanStack Start SSR pipeline entirely.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found in DOM.");

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
