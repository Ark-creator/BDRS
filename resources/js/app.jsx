import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// uncomment this if our project is already deploy it will help to prevent to our sessions activity and etc....

// // 🚫 Disable DevTools, Right-Click, View Source
// document.addEventListener("contextmenu", (e) => e.preventDefault());

// document.addEventListener("keydown", (e) => {
//     if (
//         e.key === "F12" || 
//         (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
//         (e.ctrlKey && e.key === "U") // Ctrl+U
//     ) {
//         e.preventDefault();
//         alert("Developer tools are disabled on this site.");
//     }
// });

// setInterval(() => {
//     if (window.outerWidth - window.innerWidth > 200 || 
//         window.outerHeight - window.innerHeight > 200) {
//         document.body.innerHTML = "<h1>🚫 DevTools not allowed 🚫</h1>";
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
