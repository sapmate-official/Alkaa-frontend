import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// import fs from "fs"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit (temporary solution)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Configure manual chunks to separate vendor code
        manualChunks: {
          // UI library chunks
          'ui-components': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          // Chart and visualization chunks
          'visualization': ['recharts'],
          // Animation libraries
          'animation': ['framer-motion'],
          // Core React chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Form handling
          'form-handling': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utility libraries
          'utilities': ['date-fns', 'axios', 'clsx', 'tailwind-merge'],
        }
      }
    }
  },
  server: {
    port: 5174,
    host: 'localhost',
    // hmr: {
    //   protocol: 'ws',
    //   host: 'localhost',
    //   port: 5174
    // }
  }
  
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