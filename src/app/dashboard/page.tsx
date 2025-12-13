'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Chatbot from '../components/Chatbot'; 

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isChatOpen, setIsChatOpen] = useState(false); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tenantId = localStorage.getItem('tenant_id');
        const tenantName = localStorage.getItem('tenant_name');
        const tenantEmail = localStorage.getItem('tenant_email');
        
        if (!tenantId) {
          router.push('/login');
        } else {
          setUser({
            id: tenantId,
            name: tenantName,
            email: tenantEmail,
          });
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

  const handleLogout = () => {
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_name');
    localStorage.removeItem('tenant_email');
    router.push('/login');
  };

  const handleAddProperty = () => {
    router.push('/new-listing'); 
  };
  
  // toggle function for the chatbot
  const toggleChat = () => {
      setIsChatOpen(prev => !prev);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8 relative"> 
      
      {/* Header & Info */}
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
        <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 dark:text-gray-400">
                Welcome, {user?.name}!
            </p>
            <button
                onClick={handleAddProperty}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
                + Add Property
            </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Email: {user?.email}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          This is your dashboard. TODO: Add user's bookings here
        </p>
      </div>

      {/* --- AI Chatbot Integration --- */}
      
      {/* UI panel */}
      {isChatOpen && <Chatbot onClose={toggleChat} />}

      {/* Button*/}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 left-4 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
        aria-label={isChatOpen ? "Close Chatbot" : "Open Chatbot"}
      >
        {/* Chat icon */}
        <span className="text-2xl">💬</span>
      </button>
      
    </main>
  );
}
