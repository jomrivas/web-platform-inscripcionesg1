// components/LogoutButton.tsx
'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cx } from './ui/cx';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cx(
        'flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger',
        className,
      )}
    >
      Cerrar sesión
    </button>
  );
}
