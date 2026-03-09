"use client";
import React from "react";
import Link from 'next/link';
import GradientBackground from './components/GradientBackground';
import SearchBar from "./components/SearchBar";

interface ErrorProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function Error({ error }: ErrorProps) {
  return (
    <div className={"relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-center"}>
      <h1 className="relative z-10 mb-[10px] text-6xl font-semibold">Error Occurred ;(</h1>
      <p className="relative z-10 mb-4 text-lg">{error?.message || "Something went wrong, please try again later..."}</p>
      <div className="relative z-10 flex flex-row items-center w-full min-w-[35vw] max-w-[40vw]">
        <SearchBar placeholder='Type / to search for files...' filters='files' popup={true}/>
        <Link href="/" className="px-4 py-2 ml-1.5 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text) font-medium hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors cursor-pointer text-nowrap">
          Return to home page
        </Link>
      </div>  
      <GradientBackground />
    </div>
  );
}