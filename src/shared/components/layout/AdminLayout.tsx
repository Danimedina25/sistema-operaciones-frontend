import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';
import { SocioBottomNavigation } from '@/shared/components/layout/SocioBottomNavigation';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getNavProfile } from '@/shared/components/layout/navigation';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isSocio = getNavProfile(user?.roles)?.role === 'SOCIO_COMERCIAL';
  const location = useLocation();
  const [lastPathname, setLastPathname] = useState(location.pathname);

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setIsSidebarOpen(false);
  }

  return (
    <div id="admin-layout" className="h-dvh overflow-hidden bg-slate-50">
      <div className="flex h-full">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

          <main className={`min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 ${isSocio ? 'pb-24 md:pb-6' : ''}`}>
            <Outlet />
          </main>
          <SocioBottomNavigation />
        </div>
      </div>
    </div>
  );
}
