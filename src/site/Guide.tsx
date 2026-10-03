import { useEffect, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { FileIcon } from '../components/FileIcon'
import { Code, Kbd, SiteLayout } from './SiteLayout'

type Lesson = { id: string; icon: string; title: string; time: string; summary: string; steps: ReactNode[] }

const LESSONS: Lesson[] = [
  {
    id: 'vanilla',
    icon: 'index.html',
    title: 'Your first web page with HTML, CSS, and JavaScript',
    time: '5 min',
    summary: 'No framework, just the three languages of the web.',
    steps: [
      <>Click <strong>HTML · CSS · JS</strong> in the header (or press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>W</Kbd>). This workspace has its own files, preview, and bottom panel.</>,
      <>In <code>index.html</code>, type <code>section.hero&gt;h1+p+button#cta</code> and press <Kbd>Tab</Kbd>, or type <code>h2</code> and press <Kbd>Enter</Kbd> on the Emmet suggestion. Emmet writes the markup for you.</>,
      <>
        <code>index.html</code> already links <code>&lt;link rel="stylesheet" href="styles.css"&gt;</code> and <code>&lt;script src="script.js"&gt;</code>; add more files the same way. In <code>styles.css</code>, style it:
        <Code>{`.hero { display: grid; gap: 12px; padding: 48px; }
.hero h1 { font-size: 40px; }`}</Code>
      </>,
      <>
        In <code>script.js</code>, make the button do something:
        <Code>{`document.querySelector('#cta').addEventListener('click', () => {
  document.querySelector('.hero h1').textContent = 'You clicked it!'
})`}</Code>
      </>,
      <>Watch the preview update. Press <Kbd>Ctrl</Kbd> <Kbd>J</Kbd> and open <strong>Output</strong> to see your logs and errors, <strong>Debug Console</strong> to try expressions like <code>document.title</code>, or <strong>Terminal</strong> (<Kbd>Ctrl</Kbd> <Kbd>`</Kbd>) to run <code>ls</code> or <code>node script.js</code>.</>,
    ],
  },
  {
    id: 'react',
    icon: 'App.tsx',
    title: 'Build a React component',
    time: '7 min',
    summary: 'Components, props, and state in TSX.',
    steps: [
      <>Click <strong>React</strong> in the header. <code>main.tsx</code> renders <code>App</code> into <code>#root</code>.</>,
      <>Press <Kbd>Alt</Kbd> <Kbd>N</Kbd>, name the file <code>components/Counter.tsx</code>, then type <code>rfc</code> and pick the snippet.</>,
      <>
        Add state with the <code>us</code> snippet:
        <Code>{`import { useState } from 'react'

export function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = useState(start)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}`}</Code>
      </>,
      <>Typing <code>useSt</code> and pressing <Kbd>Enter</Kbd> on <code>useState</code> adds <code>import {'{ useState }'} from 'react'</code> for you. Unused imports and variables are dimmed, so you can spot leftovers.</>,
      <>In <code>App.tsx</code> type <code>&lt;Coun</code>, pick <code>Counter</code>, and the <code>import {'{ Counter }'} from './components/Counter'</code> line is added automatically. Render <code>&lt;Counter start={'{5}'} /&gt;</code>, then put the cursor on <code>Counter</code> and press <Kbd>F12</Kbd> to jump to its definition.</>,
      <>Press <Kbd>Shift</Kbd> <Kbd>Alt</Kbd> <Kbd>F</Kbd> to tidy the file with Prettier.</>,
    ],
  },
  {
    id: 'tailwind',
    icon: 'styles.css',
    title: 'Style quickly with Tailwind',
    time: '4 min',
    summary: 'Utility classes in HTML or JSX, with autocomplete.',
    steps: [
      <>Tailwind is always on in the React workspace. In HTML · CSS · JS it turns on when the project has a <code>tailwind.config.js</code> (the Tailwind Landing Page template includes one).</>,
      <>Type <code>className="</code> and press <Kbd>Ctrl</Kbd> <Kbd>Space</Kbd> for class suggestions with color swatches.</>,
      <>Customize colors or fonts in <code>tailwind.config.js</code>; the preview picks up changes immediately.</>,
    ],
  },
  {
    id: 'import',
    icon: 'package.json',
    title: 'Bring in an existing project',
    time: '3 min',
    summary: 'Upload files or a whole folder.',
    steps: [
      <>Drag a folder from your file manager onto the editor window, or click <em>Upload folder</em> in the Explorer.</>,
      <>A single folder opens like <em>Open Folder</em> in VS Code: its structure becomes the project, its name becomes the Explorer root, and the preview runs it right away.</>,
      <><code>node_modules</code>, <code>.git</code>, and build folders are skipped, along with text files over 250 KB. Images (PNG, JPG, GIF, WebP…) up to 1.5 MB are imported and open in the image viewer; other binary files are skipped.</>,
      <>If a file already exists you are asked before it is replaced. Uploaded loose files merge into the current project.</>,
      <>Upload into the matching workspace: React projects need <code>main.tsx</code>/<code>main.jsx</code> or <code>App.tsx</code> (a <code>src/</code> layout works too); plain pages use <code>index.html</code>, <code>styles.css</code>, and <code>script.js</code> in HTML · CSS · JS.</>,
    ],
  },
  {
    id: 'ship',
    icon: 'vite.config.ts',
    title: 'Download and run locally',
    time: '3 min',
    summary: 'Turn your playground into a real Vite project.',
    steps: [
      <>Click the download icon in the header or press <Kbd>Ctrl</Kbd> <Kbd>Alt</Kbd> <Kbd>S</Kbd>. In HTML · CSS · JS you get a folder you can open straight in a browser; the steps below are for React.</>,
      <>
        Unzip it and run:
        <Code>{`npm install
npm run dev`}</Code>
      </>,
      <>Need just one piece? Hover any file or folder in the Explorer and click its download icon.</>,
    ],
  },
  {
    id: 'desktop',
    icon: 'manifest.json',
    title: 'Install Playground on your desktop',
    time: '1 min',
    summary: 'Its own window, its own icon, and offline support.',
    steps: [
      <>Open Playground in Chrome or Edge and click <em>Install app</em> in the header (or the install icon in the address bar).</>,
      <>Launch it from your Start menu, Dock, or desktop. Ctrl+N, Ctrl+W, and other browser-reserved shortcuts work in the installed app.</>,
      <>Hide the header with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> <Kbd>H</Kbd> for a distraction-free window.</>,
    ],
  },
]

export function Guide({ section }: { section?: string }) {
  useEffect(() => {
    if (section) document.getElementById(`guide-${section}`)?.scrollIntoView({ block: 'start' })
  }, [section])

  return (
    <SiteLayout route="guide" brand>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">Guides</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">Short, hands-on walkthroughs. Keep the editor open in another tab and follow along.</p>
        <p className="mt-4 max-w-2xl rounded-xl border border-accent/30 bg-accent/[0.06] px-4 py-3 text-sm leading-6 text-fg/90">
          <strong>First time here?</strong> Nothing to install and no account needed; it's free. Open the editor and a 30-second tour shows you around (replay it any time with <em>Help: Start Walkthrough</em> in <Kbd>Ctrl</Kbd> <Kbd>Shift</Kbd> <Kbd>P</Kbd>). Then start with the first lesson below.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {LESSONS.map((lesson) => (
            <a key={lesson.id} href={`#/guide/${lesson.id}`} className="flex items-start gap-3 rounded-xl border border-fg/10 p-4 hover:border-accent/50 hover:bg-fg/[0.03]">
              <FileIcon path={lesson.icon} size={22} className="mt-0.5" />
              <span>
                <span className="block font-medium">{lesson.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{lesson.summary} · {lesson.time}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-16 space-y-16">
          {LESSONS.map((lesson, index) => (
            <section key={lesson.id} id={`guide-${lesson.id}`} className="scroll-mt-20">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Guide {index + 1} · {lesson.time}</p>
              <h2 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight">
                <FileIcon path={lesson.icon} size={24} /> {lesson.title}
              </h2>
              <ol className="mt-6 space-y-4 border-l border-fg/10 pl-6 text-[15px] leading-7 text-fg/85 [&_code]:rounded [&_code]:bg-fg/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]">
                {lesson.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="relative">
                    <span className="absolute -left-[37px] top-0.5 grid h-6 w-6 place-items-center rounded-full border border-fg/15 bg-app font-mono text-[11px] text-muted">{stepIndex + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <a href="#/app" className="mt-16 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:brightness-110">
          Open the editor <ArrowRight size={16} />
        </a>
      </div>
    </SiteLayout>
  )
}
