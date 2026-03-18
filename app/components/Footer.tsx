import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="relative mt-auto w-full border-t border-(--component-border) bg-(--component-bg) text-(--footer-text) backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl text-(--footer-heading) mb-4">
              <span className="">FileDBDownload</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-6">
              Powerfull platform for sharing files with the world. Find and download files in seconds, or upload your own to share with others.
            </p>
          </div>
          
          <div>
            <h3 className="text-(--footer-heading) font-semibold mb-4">Users</h3>
            <ul className="space-y-2 text-sm">
                <li><a href="/settings">Settings</a></li>
                <li><a href="/profile">Profile</a></li>
                <li><a href="/favorites">Favorites</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-(--footer-heading) font-semibold mb-4">Files</h3>
            <ul className="space-y-2 text-sm">
                <li><a href="/browse">Browse</a></li>
                <li><a href="/upload">Upload</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-(--component-border) pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>Made by <a href="https://github.com/TeeqPRO" target="_blank" rel="noopener noreferrer">TeeqPRO</a></p>
          <div className="flex items-center gap-6">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
