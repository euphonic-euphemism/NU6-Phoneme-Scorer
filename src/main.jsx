import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Bundle offline fonts
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Expose offline libraries globally for existing components and report generators
window.Chart = Chart;
window.html2canvas = html2canvas;
window.jspdf = { jsPDF };
if (!jsPDF.API.autoTable) {
    jsPDF.API.autoTable = function (...args) {
        return autoTable(this, ...args);
    };
}

import App from './app.jsx';

// Import Tailwind CSS
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
