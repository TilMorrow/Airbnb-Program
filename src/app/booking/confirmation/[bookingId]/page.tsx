'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'

interface BookingConfirmationProps {
  params: {
    bookingId: string
  }
}

interface BookingDetails {
  b_id: string
  b_check_in: string
  b_check_out: string
  b_guests: number
  b_total_price: number
  b_special_requests: string | null
  property: {
    p_address: string
    p_bedrooms: number
    p_bathrooms: number
  }
}

export default function BookingConfirmation({ params }: BookingConfirmationProps) {
  const router = useRouter()
  const bookingId = params.bookingId
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Fetch booking with property details
        const { data, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            b_id,
            b_check_in,
            b_check_out,
            b_guests,
            b_total_price,
            b_special_requests,
            property:p_id (
              p_address,
              p_bedrooms,
              p_bathrooms
            )
          `)
          .eq('b_id', bookingId)
          .eq('t_id', session.user.id)
          .single()

        if (bookingError || !data) {
          console.error('Booking fetch error:', bookingError)
          setError('Booking not found')
          setLoading(false)
          return
        }

        setBooking(data as any)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Booking Not Found'}
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    )
  }

  const checkInDate = new Date(booking.b_check_in).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const checkOutDate = new Date(booking.b_check_out).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const nights = Math.ceil(
    (new Date(booking.b_check_out).getTime() - new Date(booking.b_check_in).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment has been successfully processed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {booking.property.p_address}
            </h2>
            <p className="text-blue-100">
              {booking.property.p_bedrooms} bedrooms • {booking.property.p_bathrooms} bathrooms
            </p>
          </div>

          {/* Booking Information */}
          <div className="p-6 space-y-6">
            
            {/* Confirmation Number */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmation Number</p>
              <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                {booking.b_id}
              </p>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-in</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {checkInDate}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-out</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {checkOutDate}
                </p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Number of Guests</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {booking.b_guests} {booking.b_guests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nights</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            </div>

            {/* Special Requests */}
            {booking.b_special_requests && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Special Requests</p>
                <p className="text-gray-900 dark:text-white">
                  {booking.b_special_requests}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Total Amount */}
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Paid
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${booking.b_total_price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/home')}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition"
          >
            Book Another Property
          </button>
        </div>
      </div>
    </main>
  )
}