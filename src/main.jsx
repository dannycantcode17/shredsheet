import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { StoreProvider } from './state/store.jsx'
import { registerServiceWorker } from './lib/pwa.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
)

// Offline support + installability (hosted build only; no-op in dev / single-file).
if (import.meta.env.PROD) registerServiceWorker()
