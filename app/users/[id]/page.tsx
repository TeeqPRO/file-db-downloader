"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DownloadCard from '../../components/DownloadCard';
import GradientBackground from '@/app/components/GradientBackground';

type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  joinedAt: string;
};

type PublicStats = {
  uploadsCount: number;
  totalDownloads: number;
  totalStarsReceived: number;
  uploadsLast30Days: number;
  lastUploadDate: string | null;
};

type FileItem = {
  id: string;
  title: string;
  description: string;
  size: string;
  downloads: number;
  date: string;
  imagePath: string;
};

type PublicProfileResponse = {
  user: PublicUser;
  stats: PublicStats;
  uploads: FileItem[];
};

export default function PublicUserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = String(params?.id || '');

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('User not found.');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/users/${userId}/public`);
        const rawText = await res.text();
        let parsed: unknown = {};
        let errorText = '';
        try {
          parsed = rawText ? JSON.parse(rawText) : {};
        } catch {
          errorText = rawText || 'Failed to load user profile.';
        }
        if (!res.ok) {
          const apiError =
            typeof parsed === 'object' && parsed !== null && 'error' in parsed
              ? String((parsed as { error?: string }).error || '')
              : '';
          setError(apiError || errorText || 'Failed to load user profile.');
          setProfile(null);
          return;
        }

        setProfile(parsed as PublicProfileResponse);
      } catch {
        setError('Cannot load profile right now.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId]);

  if (loading) {
    return <section className='max-w-5xl mx-auto px-4 pt-30 pb-12'>Loading profile...</section>;
  }

  if (error || !profile) {
    return <section className='max-w-5xl mx-auto px-4 pt-30 pb-12 text-red-400'>{error || 'User not found.'}</section>;
  }

  return (
    <div>
          <div
            className='relative isolate flex h-[45vh] w-full flex-col items-center justify-center overflow-hidden'>
            <div className='relative z-10'>
              <h1 className='text-6xl font-semibold mb-3'> 
                Welcome to {profile.user.displayName} profile!
              </h1>
            </div>
            <GradientBackground />
          </div>

    <section className='max-w-5xl mx-auto px-4 pt-30 pb-12'>
      <div>
        <div className='flex flex-col md:flex-row md:items-center gap-4'>
          <img
            src={profile.user.avatarUrl || '/avatars/default.svg'}
            alt={profile.user.displayName}
            className='w-22 h-22 rounded-full object-cover border border-(--component-border)'
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/avatars/default.svg';
            }}
          />
          <div>
            <h1 className='text-3xl font-semibold'>{profile.user.displayName}</h1>
            <p className='text-(--text-muted)'>{profile.user.email}</p>
            <p className='text-sm text-(--text-muted) mt-1'>Joined: {profile.user.joinedAt || 'Unknown'}</p>
          </div>
        </div>

        <div className='grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-8 bg-(--component-bg) p-4 rounded-xl border border-(--component-border)'>
          <div className='p-3'>
            <p className='text-md text-(--text-muted)'>Uploads</p>
            <p className='text-sm font-semibold'>{profile.stats.uploadsCount || 0}</p>
          </div>
          <div className='p-3'>
            <p className='text-md text-(--text-muted)'>Total Downloads</p>
            <p className='text-sm font-semibold'>{profile.stats.totalDownloads || 0}</p>
          </div>
          <div className='p-3'>
            <p className='text-md text-(--text-muted)'>Stars Received</p>
            <p className='text-sm font-semibold'>{profile.stats.totalStarsReceived || 0}</p>
          </div>
          <div className='p-3'>
            <p className='text-md text-(--text-muted)'>Uploads (30d)</p>
            <p className='text-sm font-semibold'>{profile.stats.uploadsLast30Days || 0}</p>
          </div>
          <div className='p-3'>
            <p className='text-md text-(--text-muted)'>Last Upload</p>
            <p className='text-sm font-semibold'>{profile.stats.lastUploadDate || 'No uploads yet'}</p>
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>Uploads</h2>
        {profile.uploads.length === 0 && <p className='text-(--text-muted)'>This user has no uploads yet.</p>}

        <div className='flex flex-col gap-6'>
          {profile.uploads.map((item) => (
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
            />
          ))}
        </div>
      </div>
    </section>
    </div>
  );
}
