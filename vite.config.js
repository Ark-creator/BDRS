import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
                    'vendor-animation': ['framer-motion', 'gsap'],
                    'vendor-charts': ['recharts'],
                    'vendor-ocr': ['tesseract.js'],
                    'vendor-utils': ['sweetalert2', 'date-fns', 'lucide-react'],
                },
            },
        },
    },
});
