import { registerWorkRefresh } from '@/modules/operations/api/register-work-refresh';
import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { AppProviders } from '@/app/providers/AppProviders';

import '@/styles/index.css';

const queryClient = new QueryClient();
registerWorkRefresh(queryClient);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  </React.StrictMode>,
);