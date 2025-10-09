'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if there's a tenant_id in localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (tenantId) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard');
        } else {
          // User is not logged in, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-semibold">Loading...</div>
    </main>
  );
}