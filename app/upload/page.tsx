"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Buttons from '../components/Buttons';
import GradientBackground from '../components/GradientBackground';

export default function UploadPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoggedIn(!!localStorage.getItem('token'));
    }
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !image || !title.trim()) {
      setMessage('Title, file and image are required.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('file', file);
      formData.append('image', image);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await res.text();
        setMessage(`Upload failed (${res.status}): ${raw.slice(0, 180)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || `Upload failed (${res.status}).`);
        return;
      }

      setMessage('Upload successful!');
      router.push('/browse');
    } catch {
      setMessage('Upload failed. Check backend server and auth token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loggedIn) {
    return <div className='pt-30 text-center'><h1>Upload</h1><p>You must be logged in to upload files.</p></div>;
  }

  return (
      <div>
        <div className='max-w-2xl mx-auto px-6 pt-30 pb-12 z-99 relative'>
        <h1 className='text-5xl font-semibold mb-6'>Upload</h1>
        <form onSubmit={handleUpload} className='rounded-2xl border border-(--component-border) bg-(--component-bg) p-6 flex flex-col gap-3'>
          <input
            type='text'
            placeholder='Title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='px-3 py-2 rounded-lg border border-(--component-border)'
          />
          <textarea
            placeholder='Description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='px-3 py-2 rounded-lg border border-(--component-border) min-h-30'
          />
          <div className='flex flex-col gap-1'>
            <label className='text-sm'>Select file</label>
            <input type='file' onChange={(e) => setFile(e.target.files?.[0] ?? null)} className='px-3 py-2 rounded-lg border border-(--component-border) ' />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm'>Select preview image</label>
            <input type='file' accept='image/*' onChange={(e) => setImage(e.target.files?.[0] ?? null)} className='px-3 py-2 rounded-lg border border-(--component-border) ' />
          </div>

          <Buttons
            type='primary'
            htmlType='submit'
            disabled={isSubmitting}
            text={isSubmitting ? 'Uploading...' : 'Upload'}
          />

          {message && <p className='text-sm text-(--text-muted)'>{message}</p>}
        </form>
      </div>
      <GradientBackground />
    </div>
  );
}