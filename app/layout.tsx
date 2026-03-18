import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

import "./globals.css";
import Footer from "./components/Footer";
import Header from "./components/Header";


export const metadata: Metadata = {
  title: "FileDBDownloader",
  description: "Database with free files available for free download. Find your file in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col bg-(--bg) text-(--text-primary)`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
