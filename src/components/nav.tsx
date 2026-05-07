import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="bg-slate-950 border-b border-slate-800/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 py-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <span className="flex items-center gap-1.5 text-violet-400 font-mono text-xs font-bold bg-violet-950/60 border border-violet-800/60 px-2.5 py-1 rounded tracking-widest group-hover:border-violet-600 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 group-hover:bg-violet-300" />
              SHELBY
            </span>
            <span className="hidden sm:inline text-slate-200 font-medium text-sm tracking-tight group-hover:text-white transition-colors">
              AI Evidence Vault
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/upload', label: 'Upload' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
            <a
              href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              GitHub
            </a>
            <a
              href="#docs"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
