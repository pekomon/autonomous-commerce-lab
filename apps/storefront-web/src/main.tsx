import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { SupabaseProvider } from './lib/SupabaseContext';
import { loadRuntimeSupabaseConfig } from './lib/runtimeConfig';
import { createSupabaseClientState } from './lib/supabaseClient';
import './styles.css';

async function bootstrap() {
  const runtimeConfig = await loadRuntimeSupabaseConfig();
  const supabaseState = createSupabaseClientState(runtimeConfig);

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <SupabaseProvider value={supabaseState}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </SupabaseProvider>
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
