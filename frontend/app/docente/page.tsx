'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /docente → redirect to the docente home view */
export default function DocenteRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/docente/home');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center text-white">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-r-transparent mb-3" />
        <p className="text-sm text-slate-400">Cargando panel docente...</p>
      </div>
    </div>
  );
}
