import { useSyncExternalStore } from 'react'
import { Check, CircleDot, CircleX, Minus, Plus, TriangleAlert } from 'lucide-react'
import { DEFAULT_SETTINGS, settingsStore } from '../lib/settings'
import { statusStore } from '../lib/statusStore'
import { themeById } from '../lib/themes'
import { workspaceStore } from '../lib/workspace'

export function StatusBar({ onTheme, errors, warnings, onProblems, unsaved, onSave }: { onTheme: () => void; errors: number; warnings: number; onProblems: () => void; unsaved: number; onSave: () => void }) {
  const snap = useSyncExternalStore(statusStore.subscribe, statusStore.get)
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get)
  const phase = snap.phase === 'building' ? 'Building' : snap.phase === 'error' ? 'Needs attention' : snap.phase === 'ready' ? 'Ready' : 'Starting'
  const theme = themeById(settings.theme).label
  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 bg-statusbar px-3 text-[11px] text-status-fg">
      <button type="button" onClick={onProblems} title="Show problems" className="flex items-center gap-1.5 rounded px-1 hover:bg-black/10">
        <CircleX size={12} /> {errors}
        <TriangleAlert size={12} /> {warnings}
      </button>
      <span className={`min-w-0 truncate ${snap.phase === 'error' ? 'font-medium text-rose-300' : ''}`}>{snap.notice || phase}</span>
      {unsaved > 0 ? (
        <button type="button" data-testid="unsaved" onClick={onSave} title="Save all (Ctrl+S)" className="flex items-center gap-1 rounded px-1 hover:bg-black/10">
          <CircleDot size={11} /> {unsaved} unsaved
        </button>
      ) : null}
      <button
        type="button"
        data-testid="autosave-toggle"
        title={settings.autoSave ? 'Auto Save is on. Click to turn it off.' : 'Auto Save is off. Click to turn it on.'}
        onClick={() => settingsStore.update({ autoSave: !settings.autoSave })}
        className="hidden items-center gap-1 rounded px-1 hover:bg-black/10 sm:flex"
      >
        {settings.autoSave && <Check size={11} />}
        Auto Save: {settings.autoSave ? 'On' : 'Off'}
      </button>
      <span className="hidden sm:inline">{workspaceStore.info().status}</span>
      <button type="button" className="ml-auto hidden rounded px-1 hover:bg-black/10 md:inline" title="Change color theme (Ctrl+K Ctrl+T)" onClick={onTheme}>{theme}</button>
      <span className="font-mono">Ln {snap.line}, Col {snap.column}</span>
      <span className="hidden font-mono sm:inline">{snap.language}</span>
      <span className="hidden md:inline">UTF-8</span>
      <button type="button" className="hidden md:inline hover:opacity-80" title="Toggle word wrap" onClick={() => settingsStore.update({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}>
        {settings.wordWrap === 'on' ? 'Wrap' : 'No wrap'}
      </button>
      <span className="hidden md:inline">Spaces: {settings.tabSize}</span>
      <span className="hidden items-center sm:flex" data-testid="font-size">
        <button type="button" title="Decrease editor font size (Ctrl+-)" aria-label="Decrease editor font size" onClick={() => settingsStore.update({ fontSize: settings.fontSize - 1 })} className="rounded p-0.5 hover:bg-black/10">
          <Minus size={11} />
        </button>
        <button type="button" title="Reset editor font size (Ctrl+0)" onClick={() => settingsStore.update({ fontSize: DEFAULT_SETTINGS.fontSize })} className="rounded px-1 font-mono hover:bg-black/10">
          {settings.fontSize}px
        </button>
        <button type="button" title="Increase editor font size (Ctrl+=)" aria-label="Increase editor font size" onClick={() => settingsStore.update({ fontSize: settings.fontSize + 1 })} className="rounded p-0.5 hover:bg-black/10">
          <Plus size={11} />
        </button>
      </span>
    </footer>
  )
}
