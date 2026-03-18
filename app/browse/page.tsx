"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GradientBackground from '../components/GradientBackground';
import SearchBar from '../components/SearchBar';
import Buttons from '../components/Buttons';

import DownloadCard from '../components/DownloadCard';

type DiscoverFile = {
  id: string;
  title: string;
  description: string;
  size: string;
  downloads: number;
  date: string;
  imagePath: string;
};

type DiscoverUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  joinedAt: string;
  uploadsCount: number;
  totalDownloads: number;
  totalStarsReceived: number;
};

const PAGE_SIZE = 30;

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [fileItems, setFileItems] = useState<DiscoverFile[]>([]);
  const [userItems, setUserItems] = useState<DiscoverUser[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const query = searchParams.get('q') || '';
  const scope = searchParams.get('scope') === 'users' ? 'users' : 'files';

  const fetchPage = async (targetPage: number, reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?page=${targetPage}&q=${encodeURIComponent(query)}&scope=${scope}`);
      if (!res.ok) {
        if (scope === 'users') {
          setUserItems(reset ? [] : userItems);
        } else {
          setFileItems(reset ? [] : fileItems);
        }
        setHasMore(false);
        return;
      }
      const data = await res.json();
      const fetched = Array.isArray(data.items) ? data.items : [];
      if (scope === 'users') {
        setUserItems((prev) => (reset ? fetched : [...prev, ...fetched]));
      } else {
        setFileItems((prev) => (reset ? fetched : [...prev, ...fetched]));
      }
      setHasMore(Boolean(data.hasMore));
      setPage(targetPage);
    } catch {
      if (scope === 'users') {
        setUserItems(reset ? [] : userItems);
      } else {
        setFileItems(reset ? [] : fileItems);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFileItems([]);
    setUserItems([]);
    fetchPage(1, true);
  }, [query, scope]);

  useEffect(() => {
    if (scope === 'users') {
      setStarredIds([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setStarredIds([]);
      return;
    }

    fetch('/api/starred/ids', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStarredIds(Array.isArray(data.items) ? data.items : []))
      .catch(() => setStarredIds([]));
  }, [fileItems.length, scope]);

  return (
    <div>
      <div
        className='relative isolate flex h-[70vh] w-full flex-col items-center justify-center overflow-hidden'>
        <div className='relative z-10'>
          <h1 className='text-6xl font-semibold mb-3'> 
            Browse and Search Files
          </h1>
          <div className="w-full">
            <SearchBar placeholder='Type /files to search files, or /users to find people...' filters='files' slash={true} />
          </div>
        </div>
        <GradientBackground />
      </div>        

      <div className='relative isolate flex w-full flex-col items-center justify-center overflow-hidden py-10'>
        <h2 className='text-4xl font-semibold mb-8'>
          {scope === 'users'
            ? (query ? `User Results for "${query}"` : 'Browse Users')
            : (query ? `Search Results for "${query}"` : 'Featured Files')}
        </h2>
        <div className='w-full max-w-5xl gap-6 px-4 flex flex-col'>
          {scope === 'users' && userItems.map((user) => (
            <a
              key={user.id}
              href={`/users/${user.id}`}
              className='rounded-2xl border border-(--component-border) p-6 flex flex-col md:flex-row gap-5 w-full items-start md:items-center bg-(--page-bg) hover:brightness-95 transition cursor-pointer'
            >
              <img
                src={user.avatarUrl || '/avatars/default.svg'}
                alt={user.displayName}
                className='w-20 h-20 rounded-full object-cover border border-(--component-border)'
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/avatars/default.svg';
                }}
              />
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-(--text-primary)'>{user.displayName}</h3>
                <p className='text-(--text-muted)'>{user.email}</p>
                <div className='mt-3 text-sm text-(--text-muted) flex flex-wrap gap-3'>
                  <span>{user.uploadsCount} uploads</span>
                  <span>{user.totalDownloads} total downloads</span>
                  <span>{user.totalStarsReceived} stars received</span>
                </div>
              </div>
              <span className='text-sm text-(--text-muted)'>View profile</span>
            </a>
          ))}

          {scope === 'files' && fileItems.map((item) => (
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
              initialStarred={starredIds.includes(item.id)}
            />
          ))}

          {!loading && scope === 'files' && fileItems.length === 0 && (
            <p className='text-(--text-muted) text-center py-6'>No files found.</p>
          )}

          {!loading && scope === 'users' && userItems.length === 0 && (
            <p className='text-(--text-muted) text-center py-6'>No users found.</p>
          )}

          {hasMore && (
            <div className='w-full flex justify-center pt-4'>
              <Buttons
                type='secondary'
                onClick={() => fetchPage(page + 1)}
                disabled={loading}
                text={loading ? 'Loading...' : `Load More (${PAGE_SIZE})`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}