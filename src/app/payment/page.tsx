'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase/client'

interface PaymentMethod {
  paym_id: string
  paym_type: string
  paym_cardnum: string
  paym_expiry: string
  paym_fname: string
  paym_lname: string
}

export default function Payment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('propertyId')
  
  const [loading, setLoading] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [error, setError] = useState('')
  
  // Saved payment methods
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [useManualEntry, setUseManualEntry] = useState(true)
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Get booking details from sessionStorage
      const pendingBooking = sessionStorage.getItem('pendingBooking')
      if (!pendingBooking) {
        router.push('/home')
        return
      }
      
      try {
        const details = JSON.parse(pendingBooking)
        setBookingDetails(details)
        
        // Fetch saved payment methods using session user id
        fetchSavedPaymentMethods(session.user.id)
      } catch (err) {
        console.error('Failed to parse booking details:', err)
        router.push('/home')
      }
    }

    init()
  }, [router])

  const fetchSavedPaymentMethods = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('paym_id, paym_type, paym_cardnum, paym_expiry, paym_fname, paym_lname')
        .eq('t_id', tenantId)

      if (error) {
        console.error('Error fetching payment methods:', error)
        return
      }

      if (data && data.length > 0) {
        setSavedMethods(data)
        setUseManualEntry(false) // Default to saved methods if they exist
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const submission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget

    try {
      let paymentMethodId: string | null = null

      // If using manual entry, optionally save the payment method
      if (useManualEntry) {
        const manualPaymentData = {
          paym_fname: (form.elements.namedItem('first_name') as HTMLInputElement).value,
          paym_lname: (form.elements.namedItem('last_name') as HTMLInputElement).value,
          paym_cardnum: (form.elements.namedItem('card_number') as HTMLInputElement).value,
          paym_expiry: (form.elements.namedItem('expiry_date') as HTMLInputElement).value,
          paym_cvv: parseFloat((form.elements.namedItem('cvv') as HTMLInputElement).value),
          paym_type: paymentType,
          t_id: bookingDetails.t_id,
        }

        // Save payment method if user checked the box
        if (savePaymentMethod) {
          const { data: paymentMethod, error: paymentError } = await supabase
            .from('payment_methods')
            .insert([manualPaymentData])
            .select()
            .single()

          if (paymentError) {
            console.error('Payment method error:', paymentError)
            setError('Failed to save payment method: ' + paymentError.message)
            setLoading(false)
            return
          }
          
          paymentMethodId = paymentMethod.paym_id
        }
      } else {
        // Using saved payment method
        paymentMethodId = selectedMethod
      }

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            p_id: bookingDetails.p_id,
            t_id: bookingDetails.t_id,
            b_check_in: bookingDetails.b_check_in,
            b_check_out: bookingDetails.b_check_out,
            b_guests: bookingDetails.b_guests,
            b_total_price: bookingDetails.b_total_price,
            b_status: 'confirmed',
            b_special_requests: bookingDetails.b_special_requests,
          },
        ])
        .select()
        .single()

      if (bookingError) {
        console.error('Booking error:', bookingError)
        setError('Failed to create booking: ' + bookingError.message)
        setLoading(false)
        return
      }

      // Create payment record in payments table
      const { error: paymentRecordError } = await supabase
        .from('payments')
        .insert([
          {
            pay_date: new Date().toISOString(),
            pay_amount: bookingDetails.b_total_price,
            b_id: booking.b_id,
          },
        ])

      if (paymentRecordError) {
        console.error('Payment record error:', paymentRecordError)
        setError('Booking created but failed to record payment')
        setLoading(false)
        return
      }

      // Clear sessionStorage
      sessionStorage.removeItem('pendingBooking')

      // Success - redirect to confirmation
      router.push(`/booking/confirmation/${booking.b_id}`)
      
    } catch (err) {
      console.error('Payment submission error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!bookingDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </main>
    )
  }

  const maskCardNumber = (cardNum: string) => {
    return `**** **** **** ${cardNum.slice(-4)}`
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Booking Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Your Payment
          </h1>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              Booking Summary
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Property:</strong> {bookingDetails.property_address}</p>
              <p><strong>Check-in:</strong> {bookingDetails.b_check_in}</p>
              <p><strong>Check-out:</strong> {bookingDetails.b_check_out}</p>
              <p><strong>Guests:</strong> {bookingDetails.b_guests}</p>
              <p><strong>Nights:</strong> {bookingDetails.nights}</p>
              <p className="text-xl font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                <strong>Total:</strong> ${bookingDetails.b_total_price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Toggle */}
        {savedMethods.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setUseManualEntry(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  !useManualEntry
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Saved Payment Methods
              </button>
              <button
                onClick={() => setUseManualEntry(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  useManualEntry
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Enter New Card
              </button>
            </div>

            {/* Saved Payment Methods */}
            {!useManualEntry && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Select a Payment Method
                </h3>
                {savedMethods.map((method) => (
                  <button
                    key={method.paym_id}
                    onClick={() => setSelectedMethod(method.paym_id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition ${
                      selectedMethod === method.paym_id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {method.paym_type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {maskCardNumber(method.paym_cardnum)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.paym_fname} {method.paym_lname}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Expires: {method.paym_expiry}
                        </p>
                      </div>
                      {selectedMethod === method.paym_id && (
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Payment Entry */}
        {useManualEntry && (
          <>
            {/* Payment Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Select Payment Type
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setPaymentType('Visa')}
                  type="button"
                  className={`p-3 border-2 rounded-lg transition ${
                    paymentType === 'Visa'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">Visa</div>
                </button>
                
                <button
                  onClick={() => setPaymentType('MasterCard')}
                  type="button"
                  className={`p-3 border-2 rounded-lg transition ${
                    paymentType === 'MasterCard'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">MasterCard</div>
                </button>
                
                <button
                  onClick={() => setPaymentType('American Express')}
                  type="button"
                  className={`p-3 border-2 rounded-lg transition ${
                    paymentType === 'American Express'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">Amex</div>
                </button>
                
                <button
                  onClick={() => setPaymentType('PayPal')}
                  type="button"
                  className={`p-3 border-2 rounded-lg transition ${
                    paymentType === 'PayPal'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">PayPal</div>
                </button>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Details
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={submission}>
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      First name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="John"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Doe"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="card_number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="card_number"
                      name="card_number"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="4111 1111 1111 1111"
                      pattern="[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="expiry_date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      id="expiry_date"
                      name="expiry_date"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="MM/YYYY"
                      pattern="[0-9]{2}/[0-9]{4}"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cvv" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="123"
                      pattern="[0-9]{3,4}"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Save Payment Method Checkbox */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={savePaymentMethod}
                      onChange={(e) => setSavePaymentMethod(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      Save this payment method for future bookings
                    </span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !paymentType}
                  className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Payment...' : `Pay $${bookingDetails.b_total_price.toFixed(2)}`}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Quick Checkout Button */}
        {!useManualEntry && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                {error}
              </div>
            )}
            
            <form onSubmit={submission}>
              <button
                type="submit"
                disabled={loading || !selectedMethod}
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Payment...' : `Pay $${bookingDetails.b_total_price.toFixed(2)}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}