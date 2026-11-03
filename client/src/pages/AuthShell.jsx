export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      <div className="hidden bg-river-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#F3F6F5" /><path d="M7 16 16 8l9 8v9H7z" fill="#1E6B5A" /><rect x="13" y="18" width="6" height="7" rx="3" fill="#F2A71B" /></svg>
          Hometown Hub
        </div>
        <div>
          <p className="max-w-md font-display text-4xl font-bold leading-tight">Your gali, your gaon, your people. All in one place.</p>
          <p className="mt-4 max-w-md text-river-100">Join the community from your city or village. Share news, plan events and stay close to home, wherever life takes you.</p>
        </div>
        <p className="text-sm text-river-200">Built for hyperlocal communities</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-ink/60">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
