"use client"
import React from 'react';
import Link from 'next/link';
import GradientBackground from './components/GradientBackground';
import SearchBar from './components/SearchBar';

import "./globals.css";

export default function NotFound() {
  return (
    <div className={"relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-center"}>
      <div>
        <h1 className="relative z-10 mb-5 text-6xl font-semibold max-w-[40vw]">Page is not found</h1>
        <div className="relative z-10 flex flex-row items-center w-full min-w-[35vw] max-w-[40vw]">
          <SearchBar placeholder='Type / to search for files...' filters='files' slash={true} />
          <Link href="/" className="px-4 py-2 ml-1.5 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text) font-medium hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors cursor-pointer text-nowrap">
            Return to home page
          </Link>
        </div>  
      </div>
      <GradientBackground />
    </div>
  );
}
