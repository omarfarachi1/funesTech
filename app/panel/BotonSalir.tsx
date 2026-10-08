'use client';

import { useRouter } from 'next/navigation';

export default function BotonSalir({ className = 'principal' }: { className?: string }) {
  const router = useRouter();

  async function salir() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button className={className} onClick={salir}>
      Cerrar sesión
    </button>
  );
}
