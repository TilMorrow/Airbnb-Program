'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Chatbot from '../components/Chatbot'; 
import { supabase } from '../lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Booking {
  b_id: string;
  b_check_in: string;
  b_check_out: string;
  b_guests: number;
  b_total_price: number;
  b_status: string;
  property: {
    p_id: number;
    p_address: string;
    p_bedrooms: number;
    p_bathrooms: number;
    p_image: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); 

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

        // Fetch user's bookings
        await fetchBookings(tenant.t_id);

      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          b_id,
          b_check_in,
          b_check_out,
          b_guests,
          b_total_price,
          b_status,
          property:p_id (
            p_id,
            p_address,
            p_bedrooms,
            p_bathrooms,
            p_image
          )
        `)
        .eq('t_id', userId)
        .order('b_check_in', { ascending: false });

      if (error) {
        console.error('Failed to fetch bookings:', error);
        return;
      }

      setBookings(data as any || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddProperty = () => {
    router.push('/new-listing'); 
  };

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUpcoming = (checkIn: string) => {
    return new Date(checkIn) >= new Date();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    );
  }

  const upcomingBookings = bookings.filter(b => isUpcoming(b.b_check_in));
  const pastBookings = bookings.filter(b => !isUpcoming(b.b_check_in));

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8 relative"> 
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user?.name}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
        >
          Logout
        </button>
      </div>
      
      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Account Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
          </div>
          <button
            onClick={handleAddProperty}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + Add Property
          </button>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Bookings
          </h2>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            Book New Property
          </button>
        </div>

        {bookingsLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading bookings...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start exploring properties and make your first booking!
            </p>
            <button
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Upcoming Trips
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.b_id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/booking/confirmation/${booking.b_id}`)}
                    >
                      {/* Property Image */}
                      <div className="aspect-video w-full relative bg-gray-200">
                        <img
                          src={booking.property.p_image}
                          alt={booking.property.p_address}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.b_status)}`}>
                            {booking.b_status}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                          {booking.property.p_address}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <p>
                            <span className="font-medium">Check-in:</span> {formatDate(booking.b_check_in)}
                          </p>
                          <p>
                            <span className="font-medium">Check-out:</span> {formatDate(booking.b_check_out)}
                          </p>
                          <p>
                            <span className="font-medium">Guests:</span> {booking.b_guests}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ${booking.b_total_price.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/booking/confirmation/${booking.b_id}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Past Trips
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.b_id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer opacity-90"
                      onClick={() => router.push(`/booking/confirmation/${booking.b_id}`)}
                    >
                      {/* Property Image */}
                      <div className="aspect-video w-full relative bg-gray-200">
                        <img
                          src={booking.property.p_image}
                          alt={booking.property.p_address}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.b_status)}`}>
                            {booking.b_status}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                          {booking.property.p_address}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <p>
                            <span className="font-medium">Check-in:</span> {formatDate(booking.b_check_in)}
                          </p>
                          <p>
                            <span className="font-medium">Check-out:</span> {formatDate(booking.b_check_out)}
                          </p>
                          <p>
                            <span className="font-medium">Guests:</span> {booking.b_guests}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ${booking.b_total_price.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/booking/confirmation/${booking.b_id}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chatbot Integration */}
      {isChatOpen && <Chatbot onClose={toggleChat} />}
      
      <button
        onClick={toggleChat}
        className="fixed bottom-4 left-4 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none"
        aria-label={isChatOpen ? "Close Chatbot" : "Open Chatbot"}
      >
        <span className="text-2xl">💬</span>
      </button>
      
    </main>
  );
}