import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="w-full bg-(--footer-bg) text-(--footer-text) py-12 mt-auto backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl text-(--footer-heading) mb-4">
              <span className="">FileDBDownload</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-6">
              test text
            </p>
          </div>
          
          <div>
            <h3 className="text-(--footer-heading) font-semibold mb-4">Collumn1</h3>
            <ul className="space-y-2 text-sm">
                <li><a href="">test</a></li>
                <li><a href="">test</a></li>
                <li><a href="">test</a></li>
                <li><a href="">test</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-(--footer-heading) font-semibold mb-4">Collumn2</h3>
            <ul className="space-y-2 text-sm">
                <li><a href="">test</a></li>
                <li><a href="">test</a></li>
                <li><a href="">test</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-(--footer-border) pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>Made by <a href="https://github.com/TeeqPRO" target="_blank" rel="noopener noreferrer">TeeqPRO</a></p>
          <div className="flex items-center gap-6">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
