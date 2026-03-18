"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import GradientBackground from '../components/GradientBackground';

type FileDetails = {
  id: string;
  title: string;
  description: string;
  size: string;
  downloads: number;
  date: string;
  imagePath: string;
  starsCount: number;
  uploader: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    joinedAt: string;
  };
};

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/files/${id}`)
      .then((res) => res.json())
      .then((data) => setFile(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className='pt-30 text-center'>Loading...</div>;
  }

  if (!file) {
    return <div className='pt-30 text-center'>File not found.</div>;
  }

  return (
    <div>
      <div
        className='relative isolate flex h-[45vh] w-full flex-col items-center justify-center overflow-hidden'>
        <GradientBackground />
        <h1 className='text-4xl font-bold color-(--text-primary) z-10'>Download {file.title}</h1>
    </div>
    <section className='max-w-6xl mx-auto px-6 pt-30 pb-12'>
      <div className='p-6 grid md:grid-cols-[240px_1fr] gap-6'>
        <img src={file.imagePath ? `/files/${file.imagePath}` : '/avatars/default.svg'} alt={file.title} className='w-full h-60 object-contain rounded-xl' />

        <div>
          <h1 className='text-3xl font-semibold text-(--text-primary)'>{file.title}</h1>
          <p className='mt-3 text-(--text-muted)'>{file.description || 'No description'}</p>


          <div className='mt-4 text-sm text-(--text-muted) flex gap-3'>
            <span>{file.size}</span>
            <span>{file.downloads} downloads</span>
            <span>{file.starsCount || 0} stars</span>
            <span>{file.date}</span>
            <span><Link href={`/users/${file.uploader.id}`}>Uploaded by {file.uploader.displayName}</Link></span>
          </div>
          
          <div className='mt-6 flex gap-3'>
            <a href={`/api/files/${file.id}/download`} className='px-4 py-2 rounded-lg border border-(--component-border) bg-(--glass-bg) hover:brightness-90'>
              Download
            </a>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}