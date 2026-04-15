import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';

export function AdminLayout() {
  return (
    <div className="h-screen bg-slate-50">
      <div className="flex h-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="min-h-0 flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}