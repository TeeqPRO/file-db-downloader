"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import GradientBackground from './components/GradientBackground';

export default function NotFound() {
  return (
    <div className={"flex flex-col items-center justify-center min-h-screen text-center p-4"}>
        
        <h1 className="text-6xl font-semibold mb-4">404 - Page not found</h1>
        <Link href="/" className="btn-primary mt-2">
            Return to home page
        </Link>
        <GradientBackground />
    </div>
  );
}