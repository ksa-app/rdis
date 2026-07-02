'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg) setInfo(msg);

    // Handle hash-based auth tokens (when Supabase redirects with #access_token)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token && supabase) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) {
            // Clean the URL and redirect
            window.history.replaceState({}, '', window.location.pathname);
            router.push('/dashboard');
          } else {
            setError('Session setup failed. Please log in manually.');
          }
        });
      }
    }

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('Configuration error. Check environment variables.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OverseasERP</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {info && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4 text-sm">
            ℹ️ {info}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-blue-800 text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
