'use client';

import { TodaysScheduleDashboard } from '@/components/app/todays-schedule-dashboard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function TodaysSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (session?.user.role === 'CONTRIBUTOR') router.replace('/assignments');
  }, [router, session?.user.role]);

  if (status === 'loading' || session?.user.role === 'CONTRIBUTOR') return null;
  return <TodaysScheduleDashboard />;
}
