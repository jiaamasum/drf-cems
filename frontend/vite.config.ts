import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = env.VITE_PROXY_API_TARGET || env.VITE_API_ORIGIN || "http://127.0.0.1:8000"

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Avoid CORS during local development by proxying API requests.
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/admin": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
