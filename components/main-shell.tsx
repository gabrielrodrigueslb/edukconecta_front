'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarToggleProvider } from '@/components/sidebar-toggle';
import type { TenantPublic } from '@/lib/tenant';

export default function MainShell({
  children,
  initialTenantPublic,
}: {
  children: React.ReactNode;
  initialTenantPublic?: TenantPublic | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarToggleProvider open={sidebarOpen} setOpen={setSidebarOpen}>
      <main className="flex flex-col-reverse sm:flex-row w-full min-h-dvh">
        <Sidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          initialTenantPublic={initialTenantPublic}
        />
        <section className="min-h-dvh w-full overflow-x-hidden p-6 animate-in fade-in fade-out duration-100 max-h-screen">
          {children}
        </section>
      </main>
    </SidebarToggleProvider>
  );
}
