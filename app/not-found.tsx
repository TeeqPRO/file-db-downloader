"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
        <h1>404 - Nie znaleziono strony</h1>
        <Link href="/">Powrót do strony głównej</Link>
    </div>
  );
}