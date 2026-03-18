"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DownloadCard from '../components/DownloadCard';
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

export default function FavoritesPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/starred', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || 'Failed to load favorites.');
          setItems([]);
          return;
        }

        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        setError('Cannot load favorites right now.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
     <div>
      <div
          className='relative isolate flex h-[45vh] w-full flex-col items-center justify-center overflow-hidden'>
          <div className='relative z-10'>
            <h1 className='text-6xl font-semibold mb-3'> 
              Favorites
            </h1>
          </div>
          <GradientBackground />
        </div>  
      <div className='max-w-5xl mx-auto px-4 pt-30 pb-12'>

      {loading && <p>Loading...</p>}
      {!loading && error && <p className='text-red-400'>{error}</p>}
      {!loading && !error && items.length === 0 && <p className='text-(--text-muted)'>No favorites yet.</p>}

      <div className='flex flex-col gap-6'>
        {items.map((item) => (
          <DownloadCard
            key={item.id}
            fileName={item.title}
            fileDescription={item.description || 'No description'}
            fileSize={item.size || 'Unknown'}
            fileDownloads={item.downloads || 0}
            fileDate={item.date || 'Unknown'}
            fileLink={`/download?id=${item.id}`}
            fileDownloadLink={`/api/files/${item.id}/download`}
            fileImageLink={item.imagePath ? `/files/${item.imagePath}` : '/avatars/default.svg'}
            fileID={item.id}
            initialStarred={true}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
