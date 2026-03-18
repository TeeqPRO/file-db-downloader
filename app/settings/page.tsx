"use client";
import { useEffect, useState } from 'react';
import Buttons from '../components/Buttons';
import GradientBackground from '../components/GradientBackground';

export default function SettingsPage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('/avatars/default.svg');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleAvatarUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!avatarFile) {
      setAvatarMessage('Please select avatar file.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setAvatarMessage('You are not logged in.');
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await res.text();
        setAvatarMessage(`Avatar upload failed (${res.status}): ${raw.slice(0, 180)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setAvatarMessage(data.error || `Avatar upload failed (${res.status})`);
        return;
      }

      setAvatarPreview(`${data.avatarUrl}?t=${Date.now()}`);
      window.dispatchEvent(new Event('auth-changed'));
      setAvatarMessage('Avatar updated successfully.');
    } catch {
      setAvatarMessage('Avatar upload failed.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setPasswordMessage('You are not logged in.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      const res = await fetch('/api/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordMessage(data.error || 'Failed to change password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch {
      setPasswordMessage('Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-12 z-99 relative">
        <h1 className="text-4xl mb-3 font-bold text-(--text-primary)">Settings</h1>
        <div className="rounded-2xl border border-(--component-border) bg-(--component-bg) p-6 flex flex-col gap-5">
          <form onSubmit={handlePasswordChange} className="rounded-xl border border-(--component-border) p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-(--text-primary)">Change password</h2>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="rounded-lg border border-(--component-border) bg-transparent px-3 py-2 text-(--text-primary)"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="rounded-lg border border-(--component-border) bg-transparent px-3 py-2 text-(--text-primary)"
              required
            />
            <Buttons
              type="primary"
              htmlType="submit"
              disabled={passwordLoading}
              text={passwordLoading ? 'Saving...' : 'Save Password'}
            />
            {passwordMessage && <p className="text-sm text-(--text-muted)">{passwordMessage}</p>}
          </form>

          <form onSubmit={handleAvatarUpload} className="mt-6 rounded-xl border border-(--component-border) p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-(--text-primary)">Avatar</h2>
            <img src={avatarPreview} alt="avatar preview" className="w-20 h-20 rounded-full border border-(--component-border) object-cover" />
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className='px-3 py-2 rounded-lg border border-(--component-border)' />
            <Buttons
              type="primary"
              htmlType="submit"
              disabled={avatarLoading}
              text={avatarLoading ? 'Saving...' : 'Save Avatar'}
            />
            {avatarMessage && <p className="text-sm text-(--text-muted)">{avatarMessage}</p>}
          </form>
        </div>
      </div>
      <GradientBackground />
    </div>
  );
}