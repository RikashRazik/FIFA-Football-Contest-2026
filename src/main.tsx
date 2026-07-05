import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTimeSync } from './lib/timeSync.ts';

// Initialize time synchronization asynchronously
initTimeSync().catch(err => console.error("Failed to initialize time sync:", err));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

