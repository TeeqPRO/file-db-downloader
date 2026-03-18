"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';

import Buttons from './Buttons'

type DownloadCardProps = {
    fileName: string;
    fileDescription: string;
    fileSize: string;
    fileDownloads: number;
    fileDate: string;
    fileLink: string;
    fileDownloadLink: string;
    fileImageLink: string;
    fileID: string;
    initialStarred?: boolean;
}

const DownloadCard = ( { fileName, fileDescription, fileSize, fileDownloads, fileDate , fileLink, fileDownloadLink, fileImageLink, fileID, initialStarred = false}: DownloadCardProps ) => {
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);

  useEffect(() => {
    setStarred(initialStarred);
  }, [initialStarred]);

  const handleToggleStar = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/stars/toggle/${fileID}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStarred(Boolean(data.starred));
      } else if (data.error) {
        console.error(data.error);
      }
    } catch {
      // Keep UI unchanged when request fails.
    }
  };

  return (
    <div className='rounded-2xl border border-(--component-border) p-6 flex flex-col md:flex-row gap-6 w-full items-stretch bg-(--page-bg)'>
        <img
          src={fileImageLink}
          alt={fileName}
          className='w-35 h-35 object-contain rounded-xl'
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/avatars/default.svg';
          }}
        />
        
        <div className='flex flex-col flex-1 justify-between h-auto py-1'>
          <div className='flex flex-col'>
            <h3 className='text-[17px] font-bold text-(--text-primary) mb-1'>{fileName}</h3>
            <p className='text-[16px] font-medium text-(--text-muted) line-clamp-2 overflow-hidden text-ellipsis'>{fileDescription}</p>
          </div>
          
          <div className='flex items-center gap-3 text-[16px] font-normal text-(--text-muted) mt-auto pt-2'>
            <span>{fileSize}</span>
            <svg width="4" height="4" viewBox="0 0 4 4" fill="currentColor" className="opacity-50">
              <circle cx="2" cy="2" r="2" />
            </svg>
            <span>{fileDownloads} downloads</span>
            <svg width="4" height="4" viewBox="0 0 4 4" fill="currentColor" className="opacity-50">
              <circle cx="2" cy="2" r="2" />
            </svg>
            <span>{fileDate}</span>
          </div>
        </div>

        <div className='flex flex-col gap-3 shrink-0 ml-auto justify-center h-full'>
          <div className='flex gap-2 w-full'>
            <Buttons type='secondary' id={fileID} text='Star' onClick={handleToggleStar} className={starred ? 'opacity-55' : ''} />
            <Buttons type='secondary' id={fileLink} text='View more' onClick={() => router.push(fileLink)} />
          </div>
          <div className='w-full flex justify-end'>
            <Buttons
              type='secondary'
              id={fileDownloadLink}
              text='Download'
              onClick={() => window.open(fileDownloadLink, '_blank')}
            />
          </div>
        </div>
    </div>
  )
}

export default DownloadCard 