export const REACT_TYPES = `
declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: string | number }
  interface IntrinsicElements {
    [elemName: string]: {
      className?: string
      children?: any
      style?: Record<string, string | number>
      id?: string
      ref?: any
      onClick?: (event: any) => void
      onChange?: (event: any) => void
      onSubmit?: (event: any) => void
      onInput?: (event: any) => void
      onKeyDown?: (event: any) => void
      [key: string]: any
    }
  }
}

declare module "react" {
  export type ReactNode = ReactElement | string | number | bigint | boolean | null | undefined | Iterable<ReactNode>
  export type ReactElement = { type: any; props: any; key: string | null }
  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prev: S) => S)
  export type DependencyList = readonly unknown[]
  export type EffectCallback = () => void | (() => void)
  export type CSSProperties = { [key: string]: string | number | undefined }
  export type Ref<T> = { current: T } | ((instance: T | null) => void) | null
  export interface RefObject<T> { current: T }
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode }
  export type FC<P = object> = (props: P & { children?: ReactNode }) => ReactElement | null
  export interface Context<T> {
    Provider: (props: { value: T; children?: ReactNode }) => ReactElement | null
    Consumer: (props: { children: (value: T) => ReactNode }) => ReactElement | null
  }

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
  export function useEffect(effect: EffectCallback, deps?: DependencyList): void
  export function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void
  export function useMemo<T>(factory: () => T, deps: DependencyList): T
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T
  export function useRef<T>(initialValue: T): RefObject<T>
  export function useRef<T>(initialValue: T | null): RefObject<T | null>
  export function useRef<T = undefined>(): RefObject<T | undefined>
  export function useId(): string
  export function useContext<T>(context: Context<T>): T
  export function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, Dispatch<A>]
  export function useDeferredValue<T>(value: T): T
  export function useTransition(): [boolean, (callback: () => void) => void]
  export function useImperativeHandle<T>(ref: Ref<T> | undefined, init: () => T, deps?: DependencyList): void
  export function createContext<T>(defaultValue: T): Context<T>
  export function createElement(type: any, props?: any, ...children: ReactNode[]): ReactElement
  export function cloneElement(element: ReactElement, props?: any, ...children: ReactNode[]): ReactElement
  export function memo<T extends (props: any) => any>(component: T): T
  export function forwardRef<T, P = object>(render: (props: P, ref: any) => ReactElement | null): (props: P & { ref?: any }) => ReactElement | null
  export function lazy<T extends (props: any) => any>(loader: () => Promise<{ default: T }>): T
  export const Fragment: unique symbol
  export const StrictMode: (props: { children?: ReactNode }) => ReactElement | null
  export const Suspense: (props: { children?: ReactNode; fallback?: ReactNode }) => ReactElement | null
  export const Children: {
    map<T, C>(children: C, fn: (child: ReactNode, index: number) => T): T[] | null
    count(children: any): number
    toArray(children: any): ReactNode[]
  }
  const React: {
    useState: typeof useState
    useEffect: typeof useEffect
    useLayoutEffect: typeof useLayoutEffect
    useMemo: typeof useMemo
    useCallback: typeof useCallback
    useRef: typeof useRef
    useId: typeof useId
    useContext: typeof useContext
    useReducer: typeof useReducer
    createContext: typeof createContext
    createElement: typeof createElement
    cloneElement: typeof cloneElement
    memo: typeof memo
    forwardRef: typeof forwardRef
    lazy: typeof lazy
    Fragment: typeof Fragment
    StrictMode: typeof StrictMode
    Suspense: typeof Suspense
    Children: typeof Children
  }
  export default React
}

declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: any): any
  export function jsxs(type: any, props: any, key?: any): any
  export const Fragment: unique symbol
}

declare module "react/jsx-dev-runtime" {
  export function jsxDEV(type: any, props: any, key?: any, isStatic?: boolean, source?: any, self?: any): any
  export const Fragment: unique symbol
}

declare module "react-dom" {
  export function createPortal(children: any, container: Element): any
  export function flushSync<T>(fn: () => T): T
}

declare module "react-dom/client" {
  export interface Root {
    render(children: any): void
    unmount(): void
  }
  export function createRoot(container: Element | DocumentFragment): Root
  export function hydrateRoot(container: Element | Document, children: any): Root
}

declare var module: { exports: any }
declare var exports: any
declare function require(name: string): any
`
