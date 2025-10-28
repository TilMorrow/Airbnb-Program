'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';
import { hashPasswordAction } from '../../lib/auth/authPassword';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    verifyId: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        setError(`Auth error: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account - no user returned');
        setLoading(false);
        return;
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            t_name: formData.name,
            t_email: formData.email,
            t_phone: formData.phone,
            t_address: formData.address,
            t_dob: formData.dob,
            t_verify_id: formData.verifyId,
          },
        ])
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant insert error:', tenantError);
        if (tenantError.code === '23505') {
          setError('Email, phone, or address already exists');
        } else {
          setError(`Tenant creation failed: ${tenantError.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('Tenant created:', tenant);

      // Step 3: Hash password for your custom passwords table
      const hashedPassword = await hashPasswordAction(formData.password);
      console.log('Password hashed, inserting into passwords table...');

      // Step 4: Create password entry
      const { data: passwordData, error: passwordError } = await supabase
        .from('passwords')
        .insert([
          {
            pass_id: tenant.t_id,
            pass_hash: hashedPassword,
          },
        ])
        .select();

      if (passwordError) {
        console.error('Password insert error:', passwordError);
        setError(`Failed to create password: ${passwordError.message}`);
        setLoading(false);
        return;
      }

      console.log('Password created:', passwordData);

      // Success! Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join Airbnb
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* Name Input */}
          <div>
            <label 
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          {/* Email Input */}
          <div>
            <label 
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {/* Phone Input */}
          <div>
            <label 
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="123-456-7890"
              required
              disabled={loading}
            />
          </div>

          {/* Address Input */}
          <div>
            <label 
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="123 Main St"
              required
              disabled={loading}
            />
          </div>

          {/* Date of Birth Input */}
          <div>
            <label 
              htmlFor="dob"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Date of Birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white transition"
              required
              disabled={loading}
            />
          </div>

          {/* Verification ID Input */}
          <div>
            <label 
              htmlFor="verifyId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Verification ID
            </label>
            <input
              id="verifyId"
              name="verifyId"
              type="text"
              value={formData.verifyId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="Driver's License or Passport ID"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label 
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label 
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
          >
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}