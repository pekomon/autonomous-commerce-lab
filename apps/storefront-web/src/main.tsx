import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { SupabaseProvider } from './lib/SupabaseContext';
import { loadRuntimeSupabaseConfig } from './lib/runtimeConfig';
import { createSupabaseClientState } from './lib/supabaseClient';
import './styles.css';

async function bootstrap() {
  const runtimeConfig = await loadRuntimeSupabaseConfig();
  const supabaseState = createSupabaseClientState(runtimeConfig);

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <SupabaseProvider value={supabaseState}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </SupabaseProvider>
    </StrictMode>,
  );
}

void bootstrap();
