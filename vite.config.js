import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["www.tglabs.info", "tglabs.info", "156.67.217.207", "bosstimer.tglabs.info"]
  }
})
