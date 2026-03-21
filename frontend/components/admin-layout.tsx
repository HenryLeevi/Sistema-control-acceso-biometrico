'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  LayoutDashboard, Users, DoorOpen, Clock, ShieldCheck,
  AlertTriangle, FileText, LogOut, Menu, X, Fingerprint, QrCode, CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[]; // Qué roles pueden ver este item
}

const allNavItems: NavItem[] = [
  // Admin / Subadmin
  { label: 'Dashboard',        href: '/admin',              icon: LayoutDashboard, roles: ['ADMIN', 'SUBADMIN'] },
  { label: 'Usuarios',         href: '/admin/usuarios',     icon: Users,           roles: ['ADMIN', 'SUBADMIN'] },
  { label: 'Aulas',            href: '/admin/aulas',        icon: DoorOpen,        roles: ['ADMIN', 'SUBADMIN'] },
  { label: 'Horarios',         href: '/admin/horarios',     icon: Clock,           roles: ['ADMIN', 'SUBADMIN'] },
  { label: 'Permisos',         href: '/admin/permisos',     icon: ShieldCheck,     roles: ['ADMIN', 'SUBADMIN'] },
  { label: 'Reportes',         href: '/admin/reportes',     icon: FileText,        roles: ['ADMIN', 'SUBADMIN'] },
  // Biométrico (Seguridad)
  { label: 'Panel Seguridad',  href: '/biometrico',         icon: LayoutDashboard, roles: ['BIOMETRICO'] },
  { label: 'Eventos',          href: '/biometrico/eventos', icon: Fingerprint,     roles: ['ADMIN', 'SUBADMIN', 'BIOMETRICO'] },
  { label: 'Alertas',          href: '/biometrico/alertas', icon: AlertTriangle,   roles: ['ADMIN', 'SUBADMIN', 'BIOMETRICO'] },
  { label: 'Pantalla Acceso',  href: '/acceso',             icon: Fingerprint,     roles: ['BIOMETRICO'] },
  // Docente
  { label: 'Mis Horarios',     href: '/docente/home',       icon: CalendarDays,    roles: ['DOCENTE'] },
  { label: 'Generar OTP',      href: '/docente/otp',        icon: QrCode,          roles: ['DOCENTE'] },
  { label: 'Mi Historial',     href: '/docente/historial',  icon: FileText,        roles: ['DOCENTE'] },
];



export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, roles } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Case-insensitive comparison — roles from backend are uppercase, nav items now uppercase too
  const navItems = allNavItems.filter(item =>
    item.roles.some(r => roles.map(x => x.toUpperCase()).includes(r.toUpperCase()))
  );
  // Deduplicate by href (e.g. 'Mi Panel' and 'Mis Horarios' both point to /admin)
  const uniqueNavItems = navItems.filter((item, idx, arr) =>
    arr.findIndex(x => x.href === item.href && x.label === item.label) === idx
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/'),
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-slate-700 flex items-center justify-center">
              <Fingerprint className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm">Control Accesos</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {uniqueNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Modo: {process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ? 'Demo' : 'Producción'}
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="h-6 w-6" />
            </button>

            <nav className="hidden sm:flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  {index > 0 && <span className="text-slate-400">/</span>}
                  <Link
                    href={crumb.href}
                    className={cn(
                      'hover:text-slate-900',
                      index === breadcrumbs.length - 1
                        ? 'text-slate-900 font-medium'
                        : 'text-slate-600'
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-900 text-white text-sm">
                    {user?.nombre?.[0]}{user?.apellido?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{user?.nombre} {user?.apellido}</div>
                  <div className="text-xs text-slate-500">{user?.roles?.join(', ')}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-600">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


