import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SupabaseAdminPortal } from './components/SupabaseAdminPortal';
import './index.css';

const isControlRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/' || window.location.pathname === '/control' || window.location.pathname === '/control/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isControlRoute ? <SupabaseAdminPortal /> : <App />}
  </StrictMode>,
);
