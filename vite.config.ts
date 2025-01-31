import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // server: {
  //   host: '192.168.0.193',
  //   // host: 'localhost'
  //   // host: '127.0.0.1',
  //   https: {
  //     cert: fs.readFileSync('localhost.pem'),
  //     key: fs.readFileSync('localhost-key.pem')
  //   }
  // }
})