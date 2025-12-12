'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'

interface BookingPageProps {
  params: {
    propertyId: string
  }
}

interface Property {
  p_id: number
  p_address: string
  p_bedrooms: number
  p_bathrooms: number
  p_dimensions: number
  p_price_per_night: number
}

export default function BookingPage({ params }: BookingPageProps) {
  const router = useRouter()
  const propertyId = params.propertyId
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
  })

  const [nights, setNights] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Check authentication and fetch property
  useEffect(() => {
    const init = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push(`/login?redirect=/booking/${propertyId}`)
          return
        }
        
        setUserId(session.user.id)

        const propertyIdNum = parseInt(propertyId, 10)
        
        if (isNaN(propertyIdNum)) {
          setError('Invalid property ID')
          setLoading(false)
          return
        }

        const { data: propertyData, error: propertyError } = await supabase
          .from('property')
          .select('p_id, p_address, p_bedrooms, p_bathrooms, p_dimensions, p_price_per_night')
          .eq('p_id', propertyIdNum)
          .single()

        if (propertyError) {
          console.error('Property fetch error:', propertyError)
          setError('Property not found')
          return
        }

        setProperty(propertyData)
      } catch (err) {
        console.error('Init error:', err)
        setError('Failed to load booking page')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [propertyId, router])

  // Calculate nights and total price
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && property) {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 0) {
        setNights(diffDays)
        setTotalPrice(diffDays * (property.p_price_per_night || 100))
      } else {
        setNights(0)
        setTotalPrice(0)
      }
    }
  }, [formData.checkIn, formData.checkOut, property])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value,
    }))
  }

  const checkAvailability = async () => {
    if (!formData.checkIn || !formData.checkOut) {
      return true
    }

    try {
      const { data, error } = await supabase.rpc('check_booking_conflict', {
        property_id: parseInt(propertyId, 10),
        check_in: formData.checkIn,
        check_out: formData.checkOut,
      })

      if (error) {
        console.error('Availability check error:', error)
        return true
      }

      return !data
    } catch (err) {
      console.error('Availability check failed:', err)
      return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBookingLoading(true)

    try {
      if (!userId) {
        setError('User not authenticated')
        setBookingLoading(false)
        return
      }

      // Validate dates
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (checkIn < today) {
        setError('Check-in date must be today or later')
        setBookingLoading(false)
        return
      }

      if (checkOut <= checkIn) {
        setError('Check-out date must be after check-in date')
        setBookingLoading(false)
        return
      }

      if (nights === 0) {
        setError('Please select valid dates')
        setBookingLoading(false)
        return
      }

      // Check availability
      const isAvailable = await checkAvailability()
      if (!isAvailable) {
        setError('Property is not available for selected dates')
        setBookingLoading(false)
        return
      }

      // Store booking details in sessionStorage and navigate to payment
      const bookingDetails = {
        p_id: parseInt(propertyId, 10),
        t_id: userId,
        b_check_in: formData.checkIn,
        b_check_out: formData.checkOut,
        b_guests: formData.guests,
        b_total_price: totalPrice,
        b_special_requests: formData.specialRequests || null,
        property_address: property?.p_address,
        nights: nights,
      }

      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails))
      
      // Navigate to payment page
      router.push(`/payment?propertyId=${propertyId}`)
      
    } catch (err) {
      console.error('Booking submission error:', err)
      setError('An unexpected error occurred')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h2>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Book Your Stay
            </h1>
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-48 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-xl font-semibold">
                {property.p_bedrooms} Bedrooms / {property.p_bathrooms} Bathrooms
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {property.p_address}
            </h2>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <span>{property.p_bedrooms} beds</span>
              <span>•</span>
              <span>{property.p_bathrooms} baths</span>
              <span>•</span>
              <span>{property.p_dimensions} sq ft</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${property.p_price_per_night}
              </span>
              <span className="text-gray-600 dark:text-gray-400"> / night</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            
            <div className="mb-4">
              <label
                htmlFor="checkIn"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Check-in Date
              </label>
              <input
                id="checkIn"
                name="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={handleChange}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={bookingLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="checkOut"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Check-out Date
              </label>
              <input
                id="checkOut"
                name="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={handleChange}
                min={formData.checkIn || tomorrow}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={bookingLoading}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="guests"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Number of Guests
              </label>
              <input
                id="guests"
                name="guests"
                type="number"
                value={formData.guests}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={bookingLoading}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="specialRequests"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Special Requests (Optional)
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Any special requests or needs?"
                disabled={bookingLoading}
              />
            </div>

            {nights > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Price Summary
                </h3>
                <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                  <span>${property.p_price_per_night} × {nights} nights</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={bookingLoading || nights === 0}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingLoading ? 'Processing...' : `Proceed to Payment - $${totalPrice.toFixed(2)}`}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}