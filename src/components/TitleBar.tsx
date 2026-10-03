import { useSyncExternalStore, type ReactNode } from 'react'
import { BookOpen, Braces, ChevronsUp, Download, Eye, Keyboard, MonitorDown, Palette, PanelBottom, PanelLeft, Play, RotateCcw, Settings, Share2 } from 'lucide-react'
import { Logo } from './Logo'
import { installStore } from '../lib/install'
import { statusStore } from '../lib/statusStore'
import { WORKSPACES, type WorkspaceId } from '../lib/workspace'

type Props = {
  onRun: () => void
  onFormat: () => void
  onReset: () => void
  onToggleSidebar: () => void
  onTogglePreview: () => void
  onToggleConsole: () => void
  onDownload: () => void
  onSettings: () => void
  onShortcuts: () => void
  onThemes: () => void
  onShare: () => void
  onHide: () => void
  previewOpen: boolean
  consoleOpen: boolean
  compact: boolean
  workspace: WorkspaceId
  onWorkspace: (workspace: WorkspaceId) => void
}

export function TitleBar({ onRun, onFormat, onReset, onToggleSidebar, onTogglePreview, onToggleConsole, onDownload, onSettings, onShortcuts, onThemes, onShare, onHide, previewOpen, consoleOpen, compact, workspace, onWorkspace }: Props) {
  const install = useSyncExternalStore(installStore.subscribe, installStore.get)
  const phase = useSyncExternalStore(statusStore.subscribe, () => statusStore.get().phase)
  const label = phase === 'building' ? 'Building' : phase === 'error' ? 'Error' : phase === 'ready' ? 'Live' : 'Starting'
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-fg/10 bg-sidebar px-3" data-testid="title-bar" data-tour="header">
      {compact && (
        <button type="button" title="Toggle files (Ctrl+B)" onClick={onToggleSidebar} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
          <PanelLeft size={16} />
        </button>
      )}
      <a href="#/home" title="About Playground" className="flex min-w-0 items-center gap-2 rounded-lg pr-1 hover:bg-fg/5">
        <Logo size={28} />
        <span className="hidden text-sm font-semibold leading-none text-fg sm:block">Playground</span>
      </a>
      <div role="tablist" aria-label="Workspace" title="Switch workspace (Ctrl+K W)" className="ml-2 flex shrink-0 items-center rounded-lg border border-fg/10 bg-fg/[0.03] p-0.5" data-testid="workspace-switch">
        {(['web', 'react'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={workspace === id}
            data-testid={`workspace-${id}`}
            onClick={() => onWorkspace(id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${workspace === id ? 'bg-accent text-accent-fg shadow-sm' : 'text-muted hover:text-fg'}`}
          >
            <span className="hidden md:inline">{WORKSPACES[id].label}</span>
            <span className="md:hidden">{WORKSPACES[id].short}</span>
          </button>
        ))}
      </div>
      <div className={`ml-3 hidden items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] sm:flex ${phase === 'error' ? 'border-rose-400/30 text-rose-200' : 'border-fg/10 text-fg/80'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${phase === 'building' || phase === 'booting' ? 'animate-pulse bg-amber-300' : phase === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
        {label}
      </div>
      <div className="ml-auto flex items-center gap-1">
        {install === 'available' && (
          <button
            type="button"
            data-testid="install-app"
            title="Install React Playground as a desktop app"
            onClick={() => void installStore.prompt()}
            className="mr-1 hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-fg hover:bg-accent/20 md:flex"
          >
            <MonitorDown size={14} className="text-accent" />
            Install app
          </button>
        )}
        <IconButton title="Toggle preview" label="Toggle preview" active={previewOpen} onClick={onTogglePreview} icon={<Eye size={15} />} />
        <IconButton title="Toggle console (Ctrl+J)" label="Toggle console" active={consoleOpen} onClick={onToggleConsole} icon={<PanelBottom size={15} />} />
        <IconButton title="Copy share link" label="Copy share link" onClick={onShare} icon={<Share2 size={15} />} />
        <IconButton title="Download project (Ctrl+Alt+S)" label="Download project" onClick={onDownload} icon={<Download size={15} />} />
        <IconButton title="Keyboard shortcuts (Ctrl+K Ctrl+S)" label="Keyboard shortcuts" onClick={onShortcuts} icon={<Keyboard size={15} />} />
        {compact && <IconButton title="Color theme (Ctrl+K Ctrl+T)" label="Color theme" onClick={onThemes} icon={<Palette size={15} />} />}
        {compact && <IconButton title="Settings (Ctrl+,)" label="Settings" onClick={onSettings} icon={<Settings size={15} />} />}
        <a href="#/docs" title="Docs and guides" aria-label="Docs and guides" className="hidden rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg md:block">
          <BookOpen size={15} />
        </a>
        <button type="button" title="Format (Shift+Alt+F)" onClick={onFormat} className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-fg/80 hover:bg-fg/5 sm:flex">
          <Braces size={14} />
          Format
        </button>
        <button type="button" title="Reset project" onClick={onReset} className="rounded-full p-2 text-muted hover:bg-fg/5 hover:text-fg">
          <RotateCcw size={15} />
        </button>
        <button type="button" data-testid="run" title="Run (Ctrl+Enter)" onClick={onRun} className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:brightness-110">
          <Play size={12} fill="currentColor" />
          Run
        </button>
        <IconButton title="Hide header (Ctrl+K H)" label="Hide header" onClick={onHide} icon={<ChevronsUp size={15} />} />
      </div>
    </header>
  )
}

function IconButton({ title, label, onClick, icon, active }: { title: string; label: string; onClick: () => void; icon: ReactNode; active?: boolean }) {
  return (
    <button type="button" title={title} aria-label={label} aria-pressed={active} onClick={onClick} className={`rounded-md p-1.5 ${active ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}>
      {icon}
    </button>
  )
}
