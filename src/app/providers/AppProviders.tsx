import { type ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/modules/auth/store/auth.context';
import { router } from '@/app/router';

export function AppProviders({ children }: { children?: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}