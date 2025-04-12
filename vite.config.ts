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
    chunkSizeWarningLimit: 2000, // Increase to 2MB if needed
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Predefined chunks
          if (id.includes('olamaps-web-sdk') || id.includes('/services/OlaMap')) {
            return 'map-vendor';
          }
          
          // UI library chunks
          if (id.includes('@radix-ui/react-')) {
            return 'ui-components';
          }
          
          // Chart and visualization chunks
          if (id.includes('recharts')) {
            return 'visualization';
          }
          
          // Animation libraries
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          // Core React chunks
          if (['react', 'react-dom', 'react-router-dom'].some(pkg => id.includes(pkg))) {
            return 'react-vendor';
          }
          
          // Form handling
          if (['react-hook-form', '@hookform/resolvers', 'zod'].some(pkg => id.includes(pkg))) {
            return 'form-handling';
          }
          
          // Utility libraries
          if (['date-fns', 'axios', 'clsx', 'tailwind-merge'].some(pkg => id.includes(pkg))) {
            return 'utilities';
          }
          
          // App features
          if (id.includes('src/features/auth')) {
            return 'auth-feature';
          }
          
          if (id.includes('src/features/dashboard')) {
            return 'dashboard-feature';
          }
          
          if (id.includes('src/features/settings')) {
            return 'settings-feature';
          }
          
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5174,
    host: 'localhost',
   
  }
  
  
})