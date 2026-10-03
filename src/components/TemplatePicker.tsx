import { X } from 'lucide-react'
import type { Template } from '../lib/templates'
import { FileIcon } from './FileIcon'

const ICON: Record<string, string> = { react: 'App.tsx', todo: 'App.jsx', vanilla: 'index.html', landing: 'styles.css' }

export function TemplatePicker({ templates, onPick, onCancel }: { templates: Template[]; onPick: (template: Template) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" onMouseDown={onCancel} data-testid="template-picker">
      <div className="w-full max-w-2xl rounded-2xl border border-fg/10 bg-elevated p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-fg">Start a new project</h2>
          <button type="button" aria-label="Close" onClick={onCancel} className="rounded-md p-1 text-muted hover:bg-fg/5 hover:text-fg">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4 text-xs text-muted">Each template opens in its workspace (HTML/CSS/JS or React) and replaces that workspace's files. Download your current project first if you want to keep it.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              data-testid={`template-${template.id}`}
              onClick={() => onPick(template)}
              className="group flex flex-col gap-2 rounded-xl border border-fg/10 bg-fg/[0.03] p-4 text-left transition hover:border-accent/60 hover:bg-accent/10"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                <FileIcon path={ICON[template.id] ?? 'index.html'} size={18} />
                {template.name}
                <span className="ml-auto rounded-full bg-fg/10 px-2 py-0.5 text-[10px] font-medium text-muted">{template.workspace === 'web' ? 'HTML/CSS/JS' : 'React'}</span>
              </span>
              <span className="text-xs leading-5 text-muted">{template.description}</span>
              <span className="mt-auto flex flex-wrap gap-1">
                {template.stack.map((item) => (
                  <span key={item} className="rounded-full border border-fg/10 px-2 py-0.5 text-[10px] text-fg/70">{item}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
