'use client';

import { getSession, type SessionUser, type TenantInfo } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { NavUser } from './nav-user';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export default function Header({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const pathname = usePathname();

  useEffect(() => {
    async function getMe() {
      try {
        const session = await getSession();

        if (!session) {
          console.log('Usuario nao autenticado');
          return;
        }

        setUser(session.user);
        setTenant(session.tenant ?? null);
      } catch {
        console.log('Erro ao buscar dados do usuario');
      } finally {
        setTimeout(() => {
          setLoadingAuth(false);
        }, 105);
      }
    }

    getMe();
  }, []);

  const pathnameFormatted = pathname.split('/').filter(Boolean).pop() || 'main';

  const getTitle = () => {
    const key = pathnameFormatted.toLowerCase();

    switch (key) {
      case 'main':
        return 'Inicio';
      case 'chamada':
        return 'Chamada';
      case 'alunos':
        return 'Alunos';
      case 'profile':
        return 'Meu Perfil';
      case 'admin':
        return 'Administração';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const title = getTitle();

  return (
    <>
      <header className="pb-4 mb-4 border-b-2 flex justify-between items-center animate-in fade-in duration-100">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Abrir menu"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold opacity-80">{title}</h1>
        </div>

        <SidebarProvider className="w-auto min-h-0 min-w-0 flex items-center animate-in fade-in duration-100">
          {loadingAuth ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <div className="hidden md:flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md self-end" />
              </div>

              <Skeleton className="h-10 w-10 rounded-full" />

              <Skeleton className="h-5 w-4 ml-1 rounded-sm" />
            </div>
          ) : (
            user && (
              <NavUser
                user={user}
                tenantDefaultAvatarUrl={tenant?.defaultAvatarUrl}
              />
            )
          )}
        </SidebarProvider>
      </header>

      <div className=""></div>
    </>
  );
}
