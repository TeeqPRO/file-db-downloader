"use client";
import { useEffect, useState } from 'react';
import DownloadCard from '../components/DownloadCard';
import Buttons from '../components/Buttons';
import GradientBackground from '../components/GradientBackground';

type FileItem = {
  id: string;
  title: string;
  description: string;
  size: string;
  downloads: number;
  date: string;
  imagePath: string;
};

export default function ProfilePage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setUserName('User');
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const meRes = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        const resolvedName =
          me.username ||
          me.user ||
          me.displayName ||
          (typeof me.email === 'string' ? me.email.split('@')[0] : '');
        setUserName(resolvedName || 'User');
      } else {
        setUserName('User');
      }

      const res = await fetch('/api/my/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Failed to load profile files.');
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setUserName('User');
      setError('Cannot load profile right now.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleEdit = async (id: string, currentTitle: string, currentDescription: string) => {
    const nextTitle = window.prompt('New title:', currentTitle);
    if (!nextTitle) return;
    const nextDescription = window.prompt('New description:', currentDescription) ?? currentDescription;
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`/api/files/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: nextTitle, description: nextDescription }),
    });

    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this file?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`/api/files/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    await loadData();
  };

  return (
    <div>
      <div
        className='relative isolate flex h-[45vh] w-full flex-col items-center justify-center overflow-hidden'>
        <div className='relative z-10'>
          <h1 className='text-6xl font-semibold mb-3'> 
            Welcome, {userName}!
          </h1>
        </div>
        <GradientBackground />
      </div>   
      <section className='max-w-5xl mx-auto px-4 pt-30 pb-12'>
        <h2 className='text-4xl font-semibold mb-8'>
          Your Uploaded Files
        </h2>
        {loading && <p>Loading...</p>}
        {!loading && error && <p className='text-red-400'>{error}</p>}
        {!loading && items.length === 0 && <p className='text-(--text-muted)'>You have no uploaded files yet.</p>}

        <div className='flex flex-col gap-3'>
          {items.map((item) => (
            <div key={item.id} className='rounded-2xl p-3'>
              <DownloadCard
                fileName={item.title}
                fileDescription={item.description || 'No description'}
                fileSize={item.size || 'Unknown'}
                fileDownloads={item.downloads || 0}
                fileDate={item.date || 'Unknown'}
                fileLink={`/download?id=${item.id}`}
                fileDownloadLink={`/api/files/${item.id}/download`}
                fileImageLink={item.imagePath ? `/files/${item.imagePath}` : '/avatars/default.svg'}
                fileID={item.id}
              />
              <div className='mt-3 flex gap-2 justify-end'>
                <Buttons
                  type='danger'
                  text='Delete'
                  onClick={() => handleDelete(item.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}