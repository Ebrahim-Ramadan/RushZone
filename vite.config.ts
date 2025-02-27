import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({ 
      typescript: {
        tsconfigPath: './tsconfig.json', // Specify the path to your tsconfig.json
        build: true, // Enable build mode to check types during build
      },
      overlay: {
        initialIsOpen: false, // Set to false to prevent the overlay from opening on initial load
      },

    })
  ],

})
