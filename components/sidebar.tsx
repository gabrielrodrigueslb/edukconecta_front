'use client';
import {
  Users,
  LogOut,
  CalendarCheck,
  GraduationCap,
  Calendar,
  FileText,
  Bell,
  ChevronRight,
  X,
  LayoutDashboard,
  Shield,
  ChevronsUpDown,
  User,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import LogoutModal from './logoutModal';
import { cn } from '@/lib/utils';
import { withUploadsBase } from '@/lib/uploads';
import { getSession, type SessionUser, type TenantInfo } from '@/lib/auth';
import {
  getTenantPublic,
  resolveTenantAsset,
  type TenantPublic,
} from '@/lib/tenant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Sidebar({
  open,
  onOpenChange,
  initialTenantPublic,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTenantPublic?: TenantPublic | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantPublic, setTenantPublic] = useState<TenantPublic | null>(
    initialTenantPublic ?? null,
  );
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [openModalLogout, setOpenModalLogout] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };

  useEffect(() => {
    let mounted = true;
    async function getMe() {
      try {
        const [session, publicTenant] = await Promise.all([
          getSession(),
          getTenantPublic(),
        ]);

        if (!session) {
          console.log('Usuario nao autenticado');
        } else if (mounted) {
          setUser(session.user);
          setTenant(session.tenant ?? null);
        }

        if (mounted && publicTenant) {
          setTenantPublic(publicTenant);
        }
      } catch {
        console.log('Erro ao buscar dados do usuario');
      } finally {
        if (mounted) {
          setTimeout(() => {
            setLoadingAuth(false);
          }, 105);
        }
      }
    }

    getMe();
    return () => {
      mounted = false;
    };
  }, []);

  const avatarSrc = withUploadsBase(user?.avatarUrl);
  const fallbackAvatar =
    resolveTenantAsset(
      tenantPublic?.defaultAvatarUrl || tenant?.defaultAvatarUrl,
    ) || '/globo.png';
  const [resolvedAvatar, setResolvedAvatar] = useState<string>(
    avatarSrc || fallbackAvatar,
  );

  useEffect(() => {
    setResolvedAvatar(avatarSrc || fallbackAvatar);
  }, [avatarSrc, fallbackAvatar]);
  const logoSrc = resolveTenantAsset(tenantPublic?.logoUrl) || '/logo.png';

  const canSeeAvisos = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: '/main' },
    { name: 'Alunos', icon: Users, page: '/main/alunos' },
    { name: 'Frequencia', icon: CalendarCheck, page: '/main/chamada' },
    { name: 'Turmas', icon: GraduationCap, page: '/main/turmas' },
    { name: 'Calendario', icon: Calendar, page: '/main/calendario' },
    { name: 'Documentos', icon: FileText, page: '/main/documentos' },
    ...(canSeeAvisos
      ? [{ name: 'Avisos', icon: Bell, page: '/main/avisos' }]
      : []),
    ...(user?.role === 'SUPER_ADMIN'
      ? [{ name: 'Admin', icon: Shield, page: '/main/admin' }]
      : []),
  ];
  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 h-[100dvh] w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex flex-col',
          'lg:static lg:h-dvh lg:translate-x-0 transition-transform duration-300',
          open ? 'translate-x-0 sidebar-animate' : '-translate-x-full',
        )}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--brand-gradient-from) to-(--brand-gradient-to) flex items-center justify-center shadow-lg shadow-[0_12px_25px_-10px_var(--sidebar-glow)] overflow-hidden border border-sidebar-border">
              <Image
                src={logoSrc}
                alt="logo"
                width={40}
                height={40}
                sizes="40px"
              />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-primary-foreground">
                {tenantPublic?.name || tenant?.name || ''}
              </h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestao</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.page;
              const Icon = item.icon;

              return (
                <Link
                  key={item.page}
                  href={item.page}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) text-sidebar-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform group-hover:scale-110',
                      isActive
                        ? 'text-sidebar-primary-foreground'
                        : 'text-muted-foreground group-hover:text-sidebar-accent-foreground',
                    )}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-sidebar-border mt-auto">
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-border transition-all cursor-pointer group outline-none ">
                {/* Avatar - shrink-0 impede que ele seja esmagado pelo texto longo */}
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--brand-gradient-from-light)] to-[var(--brand-gradient-to-light)] flex items-center justify-center text-white font-semibold overflow-hidden shadow-sm border border-sidebar-border/50">
                  <img
                    src={resolvedAvatar}
                    alt={user?.name || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={() => {
                      if (resolvedAvatar !== fallbackAvatar) {
                        setResolvedAvatar(fallbackAvatar);
                      }
                    }}
                  />
                </div>

                {/* Textos - min-w-0 e flex-1 permitem que o truncate funcione perfeitamente */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight group-hover:text-background">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {user?.email || 'Email não disponível'}
                  </p>
                </div>

                {/* Ícone de indicação de menu (Melhora muito a UX) */}
                <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-sidebar-foreground transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>

            {/* Ajuste de alinhamento e largura do menu para ficar mais elegante */}
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
            >
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  setUserMenuOpen(false);
                  onOpenChange(false);
                  router.push('/main/profile');
                }}
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Editar perfil
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onSelect={() => {
                  setUserMenuOpen(false);
                  onOpenChange(false);
                  toggleModalLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="fixed top-0 left-0 z-50">
        {openModalLogout && (
          <LogoutModal toggleModalLogout={toggleModalLogout} />
        )}
      </div>
    </>
  );
}
