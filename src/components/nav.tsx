import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-semibold text-base hover:text-indigo-300 transition-colors"
          >
            <span className="text-indigo-400 font-mono text-sm bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
              SHELBY
            </span>
            <span className="hidden sm:inline">AI Evidence Vault</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Upload
            </Link>
            <a
              href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              GitHub
            </a>
            <a
              href="#docs"
              className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
