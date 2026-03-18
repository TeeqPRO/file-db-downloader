
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Buttons from '../components/Buttons';
import GradientBackground from '../components/GradientBackground';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setMessage('Server returned non-JSON response. Check if backend is running on port 4000.');
        return;
      }

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('auth-changed'));
        setMessage('Login successful!');
        router.push('/');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch {
      setMessage('Cannot connect to backend. Start backend server on port 4000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto px-6 pt-30 pb-12 z-99 relative">
        <h1 className='text-5xl font-semibold mb-6'>Login</h1>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-(--component-border) bg-(--component-bg) p-6 flex flex-col gap-3"
        >
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="Username or Email"
            required
            className="px-3 py-2 rounded-lg border border-(--component-border)"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="px-3 py-2 rounded-lg border border-(--component-border)"
          />
          <Buttons
            type="primary"
            htmlType="submit"
            disabled={isSubmitting}
            text={isSubmitting ? 'Logging in...' : 'Login'}
          />
          {message && (
            <div className={`text-center text-md ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{message}</div>
          )}
        </form>
      </div>
      <GradientBackground />
    </div>
  );
}