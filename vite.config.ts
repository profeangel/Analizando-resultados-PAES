import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // IMPORTANTE PARA GITHUB PAGES:
    // Reemplaza 'NOMBRE_DE_TU_REPOSITORIO' con el nombre exacto de tu repo en GitHub.
    // Ejemplo: si tu url es https://juan.github.io/mi-app/, pon base: '/mi-app/'
    // Si tu url es directamente https://juan.github.io, entonces borra esta lÃ­nea o pon base: '/'
    base: '/Analizando-resultados-PAES/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
