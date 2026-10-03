export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`} data-testid="logo">
      <rect width="64" height="64" rx="16" fill="#0B0D12" />
      <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="2" />
      <path d="M24 17 L11.5 29.5 L24 42" fill="none" stroke="#E9EDF5" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30.5 19.3v20.4c0 1.9 2.1 3 3.7 2l15.3-10.2c1.4-.9 1.4-3 0-4L34.2 17.3c-1.6-1-3.7.1-3.7 2z" fill="#C6FF3D" />
      <rect x="30.5" y="47" width="15" height="4.5" rx="2.25" fill="#5BE1FF" className="logo-caret" />
    </svg>
  )
}
