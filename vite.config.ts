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
    chunkSizeWarningLimit: 1000, // Reduce to 1MB for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Critical React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-core';
          }

          // Data fetching cache layer
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Large external visualization & map libraries
          if (id.includes('olamaps-web-sdk') || id.includes('/services/OlaMap')) {
            return 'map-vendor';
          }
          
          if (id.includes('html2canvas') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          
          if (id.includes('node_modules/recharts')) {
            return 'recharts-vendor';
          }
          
          if (id.includes('node_modules/d3') || id.includes('node_modules/d3-')) {
            return 'visualization';
          }
          
          if (id.includes('node_modules/framer-motion')) {
            return 'animation';
          }
          
          // Radix primitives & icons
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@tabler/icons')) {
            return 'icons';
          }
          
          // Routing & State management
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom')) {
            return 'routing';
          }
          if (id.includes('node_modules/jotai') || id.includes('node_modules/zustand')) {
            return 'state-management';
          }
          
          // Form and validation
          if (['react-hook-form', '@hookform/resolvers', 'zod'].some(pkg => id.includes(`node_modules/${pkg}`))) {
            return 'form-handling';
          }
          
          // Core utilities
          if (['date-fns', 'axios', 'clsx', 'tailwind-merge'].some(pkg => id.includes(`node_modules/${pkg}`))) {
            return 'utilities';
          }
          
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
  // Optimize dependency pre-bundling for faster dev startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'jotai',
      'framer-motion',
      'recharts'
    ],
    exclude: [
      'olamaps-web-sdk',
      'html2canvas',
      'jspdf'
    ]
  },
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  }
})
