import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Playground } from './components/Playground'
import { WORKSPACES, workspaceStore } from './lib/workspace'
import { Docs } from './site/Docs'
import { Guide } from './site/Guide'
import { Landing } from './site/Landing'

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-full place-items-center bg-app p-8 text-center text-fg">
          <div>
            <h1 className="text-xl font-semibold">The playground hit a problem</h1>
            <p className="mt-2 max-w-md text-sm text-muted">{this.state.error.message}</p>
            <button type="button" className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

type Route = { page: 'app' | 'home' | 'docs' | 'guide'; sub?: string }

const VISITED = 'react-playground.visited'

function returning() {
  try {
    return localStorage.getItem(VISITED) === '1' || Object.values(WORKSPACES).some((workspace) => localStorage.getItem(workspace.storageKey) != null)
  } catch {
    return true
  }
}

function parseRoute(hash: string): Route {
  const [page, sub] = hash.replace(/^#\/?/, '').split('/')
  if (page === 'home' || page === 'docs' || page === 'guide' || page === 'app') return { page, sub }
  return { page: returning() ? 'app' : 'home' }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const workspace = useSyncExternalStore(workspaceStore.subscribe, workspaceStore.get)
  const [editorMounted, setEditorMounted] = useState(route.page === 'app')

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = route.page === 'docs' ? 'Docs · Playground' : route.page === 'guide' ? 'Guides · Playground' : route.page === 'home' ? 'Playground · Frontend editor in your browser' : 'Playground'
    if (route.page !== 'app') return
    setEditorMounted(true)
    try {
      localStorage.setItem(VISITED, '1')
    } catch {
      // Storage can be unavailable in private windows.
    }
    if (route.sub === 'templates' || route.sub === 'tour') {
      const command = route.sub
      history.replaceState(null, '', '#/app')
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('pg:command', { detail: command })))
    }
  }, [route])

  return (
    <Boundary>
      {editorMounted && <Playground key={workspace} suspended={route.page !== 'app'} />}
      {route.page === 'home' && <Landing />}
      {route.page === 'docs' && <Docs section={route.sub} />}
      {route.page === 'guide' && <Guide section={route.sub} />}
    </Boundary>
  )
}
