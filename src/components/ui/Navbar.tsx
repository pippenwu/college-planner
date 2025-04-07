interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps) {
  return (
    <nav className={`z-50 mt-4 ${className}`}>
      <div className="max-w-6xl ml-2 px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <img src="/cat-icon.png" alt="CAT Logo" className="w-16 h-16" />
            <span className="font-semibold text-academic-navy text-xl font-heading">
              CAT: College Application Timeline
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
} 