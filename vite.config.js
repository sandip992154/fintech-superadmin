import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5172,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-router'],
          'ui-vendor': ['react-icons', 'lucide-react', 'react-toastify'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'],
          'date-vendor': ['date-fns', 'react-datepicker', 'react-date-range'],
          'utility-vendor': ['axios', 'file-saver', 'exceljs', 'swiper', 'react-spinners'],
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Source maps for production debugging
    sourcemap: false,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
