import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Mail, Star } from 'lucide-react'
import { Logo } from '../components/Logo'

export { Logo }

export type SiteRoute = 'home' | 'docs' | 'guide'

export const CREATOR = { name: 'Ejay Gabriel', role: 'Frontend Developer', email: 'eebudonihian@gmail.com' }

export const REPO = { url: 'https://github.com/EJ-365/ReactPlagroundDev', api: 'https://api.github.com/repos/EJ-365/ReactPlagroundDev', label: 'EJ-365/ReactPlagroundDev' }

const STARS_KEY = 'react-playground.stars'

export function GitHubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(() => {
    const cached = sessionStorage.getItem(STARS_KEY)
    return cached === null ? null : Number(cached)
  })
  useEffect(() => {
    if (stars !== null) return
    const controller = new AbortController()
    fetch(REPO.api, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => (response.ok ? (response.json() as Promise<{ stargazers_count?: number }>) : null))
      .then((data) => {
        if (typeof data?.stargazers_count !== 'number') return
        sessionStorage.setItem(STARS_KEY, String(data.stargazers_count))
        setStars(data.stargazers_count)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [stars])
  return stars
}

function formatStars(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count)
}

export function GitHubStarButton({ size = 'sm', className = '' }: { size?: 'sm' | 'lg'; className?: string }) {
  const stars = useGitHubStars()
  const lg = size === 'lg'
  return (
    <a
      href={REPO.url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={lg ? 'github-star-hero' : 'github-star'}
      aria-label={`Star ${REPO.label} on GitHub`}
      className={`group flex items-center overflow-hidden rounded-lg border border-fg/15 text-sm font-medium transition hover:border-fg/30 hover:bg-fg/[0.04] ${className}`}
    >
      <span className={`flex items-center gap-2 ${lg ? 'px-5 py-3' : 'px-2.5 py-1.5'}`}>
        <GitHubIcon size={lg ? 16 : 15} />
        <span className={lg ? '' : 'hidden md:inline'}>{lg ? 'Star on GitHub' : 'Star'}</span>
        <Star size={lg ? 15 : 13} className="text-muted transition group-hover:fill-[#e3b341] group-hover:text-[#e3b341]" />
      </span>
      {stars !== null && (
        <span className={`self-stretch border-l border-fg/15 bg-fg/[0.04] font-code tabular-nums text-muted ${lg ? 'px-3.5 py-3' : 'px-2 py-1.5 text-xs'}`} data-testid="github-stars">
          {formatStars(stars)}
        </span>
      )}
    </a>
  )
}

const LINKS: { route: SiteRoute; label: string; href: string }[] = [
  { route: 'home', label: 'Product', href: '#/home' },
  { route: 'docs', label: 'Docs', href: '#/docs' },
  { route: 'guide', label: 'Guides', href: '#/guide' },
]

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <a href="#/home" className="group flex items-center gap-2.5" aria-label="Playground home">
      <Logo size={size} className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-[15px] font-semibold tracking-tight text-fg">playground</span>
    </a>
  )
}

export function SiteLayout({ route, brand = false, children }: { route: SiteRoute; brand?: boolean; children: ReactNode }) {
  return (
    <div className={`fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-app text-fg ${brand ? 'site-brand' : ''}`} data-testid={`site-${route}`}>
      <header className="sticky top-0 z-30 border-b border-fg/[0.08] bg-app/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5 sm:px-8">
          <Wordmark />
          <span className="hidden font-code text-[11px] text-muted lg:inline">/ free &amp; open source</span>
          <div className="ml-auto hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <a key={link.route} href={link.href} aria-current={route === link.route ? 'page' : undefined} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${route === link.route ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                {link.label}
              </a>
            ))}
          </div>
          <GitHubStarButton className="hidden sm:flex" />
          <a href="#/app" data-testid="open-editor" className="ml-auto flex whitespace-nowrap sm:ml-0 items-center gap-1.5 rounded-md bg-fg px-3.5 py-1.5 text-sm font-medium text-app transition hover:bg-accent hover:text-accent-fg sm:ml-0">
            Launch editor <ArrowUpRight size={14} />
          </a>
        </nav>
        <div className="flex gap-1 px-5 pb-2 sm:hidden">
          {LINKS.map((link) => (
            <a key={link.route} href={link.href} className={`rounded-md px-3 py-1 text-xs ${route === link.route ? 'bg-fg/10 text-fg' : 'text-muted'}`}>
              {link.label}
            </a>
          ))}
        </div>
      </header>
      {children}
      <footer className="border-t border-fg/[0.08]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Wordmark size={24} />
            <p className="max-w-sm text-sm leading-6 text-muted">A VS Code-style workbench for the whole frontend stack. Free, open source, and running entirely in your browser.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-code text-[11px] uppercase tracking-[0.18em] text-muted">Product</p>
            <a href="#/app" className="block text-fg/80 hover:text-fg">Editor</a>
            <a href="#/app/templates" className="block text-fg/80 hover:text-fg">Templates</a>
            <a href="#/docs" className="block text-fg/80 hover:text-fg">Docs</a>
            <a href="#/guide" className="block text-fg/80 hover:text-fg">Guides</a>
            <a href={REPO.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-fg/80 hover:text-fg" data-testid="footer-github">
              <GitHubIcon size={13} /> Source on GitHub
            </a>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-code text-[11px] uppercase tracking-[0.18em] text-muted">Creator</p>
            <p className="text-fg/80">
              {CREATOR.name}
              <span className="block font-code text-[11px] text-muted" data-testid="footer-role">{CREATOR.role}</span>
            </p>
            <a href={`mailto:${CREATOR.email}`} className="flex items-center gap-1.5 break-all text-fg/80 hover:text-accent" data-testid="footer-email">
              <Mail size={13} className="shrink-0" /> {CREATOR.email}
            </a>
          </div>
        </div>
        <div className="border-t border-fg/[0.08]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 font-code text-[11px] text-muted sm:flex-row sm:px-8">
            <span>© 2026 {CREATOR.name} · MIT License</span>
            <span className="sm:ml-auto">$0 · no sign-up · no hidden fees</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-fg/10 bg-editor p-4 font-mono text-[12.5px] leading-6 text-fg/90">{children}</pre>
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-fg/15 bg-fg/5 px-1.5 py-0.5 font-mono text-[11px] text-fg/90">{children}</kbd>
}
