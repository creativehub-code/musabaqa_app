'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (data.role === 'judge') {
        router.push('/judge/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Festival Login</h2>
        
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none text-white placeholder-gray-400"
              placeholder="admin@fest.com"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none text-white placeholder-gray-400"
              placeholder="admin123"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200 shadow-lg shadow-purple-500/50"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400 bg-gray-900 p-4 rounded border border-gray-700">
          <p className="font-semibold text-gray-300 mb-2">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>Admin:</div><div className="text-purple-300">admin@fest.com / admin123</div>
            <div>Judge 1:</div><div className="text-purple-300">judge1@fest.com / judge123</div>
            <div>Judge 2:</div><div className="text-purple-300">judge2@fest.com / judge123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
