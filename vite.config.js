import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // debug
    sourcemap: true,
    // minify: false,
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
});
