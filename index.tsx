import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // While we use CDN tailwind, good practice to have the import for standard creates
import { initializePolyfills } from './utils/electronPolyfills';

// Initialize polyfills for Electron environment
initializePolyfills();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
