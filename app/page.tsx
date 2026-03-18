"use client"
import React from 'react';
import Link from 'next/link';
import GradientBackground from './components/GradientBackground';
import SearchBar from './components/SearchBar';

const Page = () => {
  return (
    <div>
      <div
        className='relative isolate flex h-[70vh] w-full flex-col items-center justify-center overflow-hidden'>
        <div className='relative z-10'>
          <h1 className='text-6xl font-semibold mb-3'> 
            FileDBDownloader
          </h1>
          <h2 className='text-3xl font-normal mb-5'>
            Find and download files in seconds
          </h2>
          <div className="w-full">
            <SearchBar placeholder='Type /files to search files, or /users to find people...' filters='files' slash={true} />
          </div>
        </div>
        <GradientBackground />
      </div>        
    </div>
  );
}

export default Page;