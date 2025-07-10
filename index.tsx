
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Import i18next configuration
import { LoadingSpinner } from './components/common/LoadingSpinner'; // Assuming you have this

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner message="Loading translations..." /></div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);
