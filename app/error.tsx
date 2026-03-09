"use client";
import React from "react";
import Link from 'next/link';
import GradientBackground from './components/GradientBackground';

interface ErrorProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function Error({ error }: ErrorProps) {
  return (
    <div className={"flex flex-col items-center justify-center min-h-screen text-center p-4"}>
      <h1 className="text-6xl font-semibold mb-[10px]">Error Occurred ;(</h1>
      <p className="mb-4 text-lg">Error: {error?.message || "Coś poszło nie tak. Spróbuj ponownie."}</p>
      <Link href="/" className="btn-primary mt-[20px]">
        Return to the home page
      </Link>
      <GradientBackground />
    </div>
  );
}