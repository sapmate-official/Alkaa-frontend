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
          // Critical vendor chunks (load first)
          if (['react', 'react-dom'].some(pkg => id.includes(pkg))) {
            return 'react-vendor';
          }
          
          // Large external libraries (separate chunks)
          if (id.includes('olamaps-web-sdk') || id.includes('/services/OlaMap')) {
            return 'map-vendor';
          }
          
          if (id.includes('html2canvas') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          
          if (id.includes('recharts') || id.includes('d3')) {
            return 'visualization';
          }
          
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          // UI library chunks
          if (id.includes('@radix-ui/react-') || id.includes('@tabler/icons')) {
            return 'ui-components';
          }
          
          // Routing and state management
          if (['react-router-dom', 'jotai'].some(pkg => id.includes(pkg))) {
            return 'routing-state';
          }
          
          // Form and validation
          if (['react-hook-form', '@hookform/resolvers', 'zod'].some(pkg => id.includes(pkg))) {
            return 'form-handling';
          }
          
          // Utilities (commonly used)
          if (['date-fns', 'axios', 'clsx', 'tailwind-merge', 'lodash'].some(pkg => id.includes(pkg))) {
            return 'utilities';
          }
          
          // Feature-based chunks
          if (id.includes('src/page/private/system/BillingManagement')) {
            return 'billing-feature';
          }
          
          if (id.includes('src/page/private/system/PayrollManagement')) {
            return 'payroll-feature';
          }
          
          if (id.includes('src/page/private/system/AttendanceManagement')) {
            return 'attendance-feature';
          }
          
          if (id.includes('src/page/private/system/EmployeeManagement') || 
              id.includes('src/page/private/system/DepartmentManagement') ||
              id.includes('src/page/private/system/OrganizationManagement')) {
            return 'organization-feature';
          }
          
          // System/admin features
          if (id.includes('src/page/private/system/Permission') ||
              id.includes('src/page/private/system/Role') ||
              id.includes('src/page/private/system/ActivityLog')) {
            return 'system-feature';
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
      'framer-motion'
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