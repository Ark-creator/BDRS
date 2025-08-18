import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// uncomment this if our project is already deploy it will help to prevent to our sessions activity and etc....

// 🚫 Detect DevTools shortcuts and redirect
// document.addEventListener("keydown", (e) => {
//     if (
//         e.key === "F12" ||
//         (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "K")) || // Win/Linux
//         (e.metaKey && e.altKey && (e.key === "I" || e.key === "J" || e.key === "C")) || // macOS
//         (e.ctrlKey && e.key === "U") || 
//         (e.metaKey && e.key.toLowerCase() === "u")
//     ) {
//         e.preventDefault();
//         window.location.href = "https://google.com"; // 🚀 redirect
//     }
// });

// // 🚫 Detect if DevTools window is open (approx)
// setInterval(() => {
//     if (window.outerWidth - window.innerWidth > 200 || 
//         window.outerHeight - window.innerHeight > 200) {
//         window.location.href = "https://google.com"; // 🚀 redirect
//     }
// }, 1000);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
