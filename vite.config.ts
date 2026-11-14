import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { resolveAuthConfig } from "./src/lib/authConfig";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const auth = resolveAuthConfig(process.env, loadEnv(mode, process.cwd(), "VITE_"));
  return {
  // Preserve the generated client and resolve the public-key alias at build time.
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(auth.url),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(auth.key),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
