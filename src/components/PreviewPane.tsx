import { useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet, X } from 'lucide-react'
import { statusStore } from '../lib/statusStore'
import type { Device, Problem } from '../types'

type Props = {
  html: string
  device: Device
  problems: Problem[]
  iframeRef: RefObject<HTMLIFrameElement | null>
  onDevice: (device: Device) => void
  onReload: () => void
  onReveal: (problem: Problem) => void
  onClose: () => void
  onPopout: () => void
}

const WIDTH: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  phone: '390px',
}

export function PreviewPane({ html, device, problems, iframeRef, onDevice, onReload, onReveal, onClose, onPopout }: Props) {
  const phase = useSyncExternalStore(statusStore.subscribe, () => statusStore.get().phase)
  const error = problems.find((problem) => problem.severity === 'error' && problem.source === 'build')
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-app" data-testid="preview-pane">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-fg/10 px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        <div className="mx-auto flex h-6 min-w-0 max-w-sm flex-1 items-center justify-center rounded-full bg-fg/5 px-3 text-[11px] text-muted">
          preview.local
        </div>
        <div className="flex items-center gap-0.5">
          <DeviceButton label="Desktop" active={device === 'desktop'} onClick={() => onDevice('desktop')} icon={<Monitor size={14} />} />
          <DeviceButton label="Tablet" active={device === 'tablet'} onClick={() => onDevice('tablet')} icon={<Tablet size={14} />} />
          <DeviceButton label="Phone" active={device === 'phone'} onClick={() => onDevice('phone')} icon={<Smartphone size={14} />} />
          <button type="button" title="Run again" onClick={onReload} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <RefreshCw size={14} className={phase === 'building' ? 'animate-spin' : ''} />
          </button>
          <button type="button" title="Open in a new window" aria-label="Open preview in a window" onClick={onPopout} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <ExternalLink size={14} />
          </button>
          <button type="button" title="Close preview" aria-label="Close preview" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-fg/5 hover:text-fg">
            <X size={14} />
          </button>
        </div>
      </header>
      <div className={`relative min-h-0 flex-1 ${device === 'desktop' ? '' : 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:18px_18px] p-4'}`}>
        {phase === 'building' && <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-accent" />}
        <div className="mx-auto h-full overflow-hidden bg-app shadow-2xl" style={{ width: WIDTH[device], borderRadius: device === 'desktop' ? 0 : 24, border: device === 'desktop' ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
          {html ? (
            <iframe
              ref={iframeRef}
              title="Preview"
              data-testid="preview-frame"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              referrerPolicy="no-referrer"
              srcDoc={html}
              className="h-full w-full bg-app"
              onLoad={() => {
                if (statusStore.get().phase !== 'error') statusStore.setPhase('ready')
              }}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted/75">Starting the preview…</div>
          )}
        </div>
        {error && (
          <button
            type="button"
            onClick={() => onReveal(error)}
            className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-rose-400/30 bg-[#3b1720]/95 px-3 py-2 text-left text-xs text-rose-100 shadow-xl"
          >
            {error.file ? `${error.file}${error.line ? `:${error.line}` : ''} — ` : ''}
            {error.message}
          </button>
        )}
      </div>
    </section>
  )
}

function DeviceButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`rounded-md p-1.5 ${active ? 'bg-fg/10 text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg'}`}>
      {icon}
    </button>
  )
}
