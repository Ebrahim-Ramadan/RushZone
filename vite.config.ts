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
        // build: true, // REMOVE this line.  It's not a valid option here.
      },
      overlay: {
        initialIsOpen: false, // Set to false to prevent the overlay from opening on initial load
      },
      // Add the build option here, outside the typescript object
      build: true, // Set to false to allow the build to continue despite errors
    
    })
  ],

})
