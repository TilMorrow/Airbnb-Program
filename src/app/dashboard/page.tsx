'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch tenant details
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('t_id, t_name, t_email')
          .eq('t_id', session.user.id)
          .single();

        if (error || !tenant) {
          console.error('Failed to fetch tenant:', error);
          router.push('/login');
          return;
        }

        setUser({
          id: tenant.t_id,
          name: tenant.t_name,
          email: tenant.t_email,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Sign out from Supabase Auth
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Logout
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Welcome, {user?.name}!
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Email: {user?.email}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          This is your dashboard. TODO: Add user's bookings here
        </p>
      </div>
    </main>
  );
}