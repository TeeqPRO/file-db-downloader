
"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import Buttons from './Buttons';

const Header = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('/avatars/default.svg');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const syncAuthState = async () => {
      const token = localStorage.getItem('token');
      const isLoggedIn = !!token;
      setLoggedIn(isLoggedIn);

      if (!isLoggedIn) {
        setAvatarUrl('/avatars/default.svg');
        return;
      }

      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAvatarUrl(data.avatarUrl || '/avatars/default.svg');
      } catch {
        setAvatarUrl('/avatars/default.svg');
      }
    };

    void syncAuthState();

    const onStorage = () => { void syncAuthState(); };
    const onAuthChanged = () => { void syncAuthState(); };
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-changed', onAuthChanged);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onAuthChanged);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-changed'));
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between z-999 text-(--text-primary)">
      <div className='w-full flex items-center justify-between px-8 py-4'>
        <div className="shrink-0">
          <Link href="/" className="text-2xl font-bold">
            FileDBDownload
          </Link>
        </div>

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl">
          <SearchBar placeholder='Search...' addbutton={true}/>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/browse">
            <Buttons type="tertiary" text="Discover" />
          </Link>
          {loggedIn && (
            <Link href="/upload">
              <Buttons type="tertiary" text="Upload" />
            </Link>
          )}
          {loggedIn ? (
            <div className="relative" ref={menuRef}>
              <Buttons
                type="ghost"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full overflow-hidden border border-(--component-border) bg-(--component-bg) p-0"
                ariaLabel="Open user menu"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23d7deea"/><circle cx="40" cy="30" r="14" fill="%2393a0b6"/><rect x="18" y="50" width="44" height="20" rx="10" fill="%2393a0b6"/></svg>';
                  }}
                />
              </Buttons>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-(--component-border) bg-(--component-bg) p-2 shadow-lg backdrop-blur-md">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-lg text-(--text-primary) hover:bg-(--glass-bg-hover)"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="block px-3 py-2 rounded-lg text-(--text-primary) hover:bg-(--glass-bg-hover)"
                    onClick={() => setMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 rounded-lg text-(--text-primary) hover:bg-(--glass-bg-hover)"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <Buttons
                    type="danger"
                    text="Log Out"
                    onClick={handleLogout}
                    className="w-full mt-1 text-left"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Buttons type="tertiary" text="Sign In" />
              </Link>
              <Link href="/register">
                <Buttons type="primary" text="Sign Up" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header