import React from 'react'
import Link from 'next/link'
import SearchBar from './SearchBar'

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between z-999 text-(--text-primary)">
      <div className='w-full flex items-center justify-between px-8 py-4'>
      <div className="shrink-0">
        <Link href="/" className="text-2xl font-bold">
          LOGO
        </Link>
      </div>

      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl">
        <SearchBar placeholder='Search...' addbutton={true}/>
      </div>

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