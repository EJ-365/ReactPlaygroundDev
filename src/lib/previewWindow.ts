let popup: Window | null = null

export function externalPreviewWindow() {
  if (popup && popup.closed) popup = null
  return popup
}

export function openExternalPreview(html: string) {
  const next = externalPreviewWindow() ?? window.open('', 'playground-preview', 'popup=yes,width=1100,height=800')
  if (!next) return false
  popup = next
  writePreview(next, html)
  next.focus()
  return true
}

export function syncExternalPreview(html: string) {
  const next = externalPreviewWindow()
  if (!next || !html) return
  writePreview(next, html)
}

function writePreview(target: Window, html: string) {
  target.document.open()
  target.document.write(html)
  target.document.close()
}
