import React from 'react'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between z-999 text-(--text-primary)">
        <div className='w-full flex items-center justify-between px-8 py-4'>
         {/* Left: Logo */}
      <div className="shrink-0">
        <Link href="/" className="text-2xl font-bold">
          LOGO
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full px-12 py-2 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-1 hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Link href="/browse" className="font-medium text-(--text-primary) hover:text-(--text-primary) transition-colors">
          Discover
        </Link>
        <Link href="/login" className="font-medium text-(--text-primary) hover:text-(--text-primary) transition-colors">
          Sign In
        </Link>
        <Link href="/register" className="px-4 py-2 border border-(--ui-border) rounded-lg bg-(--glass-bg) backdrop-blur-md text-(--text-primary) font-medium hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors">
          Sign Up
        </Link>
      </div>
     </div>
    </header>
  )
}

export default Header