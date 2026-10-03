import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setupInstall } from './lib/install'
import { importSharedProject } from './lib/share'
import './index.css'

setupInstall()

await importSharedProject()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
