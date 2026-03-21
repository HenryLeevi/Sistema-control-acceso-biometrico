'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        const upperRoles = roles.map(r => r.toUpperCase());
        if (upperRoles.includes('ADMIN')) {
          router.push('/admin');
        } else if (upperRoles.includes('SUBADMIN')) {
          router.push('/subadmin');
        } else if (upperRoles.includes('DOCENTE')) {
          router.push('/docente');
        } else if (upperRoles.includes('BIOMETRICO') || upperRoles.includes('PWA')) {
          router.push('/biometrico');
        } else {
          router.push('/admin'); // Fallback
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, roles]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-2 text-sm text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}
