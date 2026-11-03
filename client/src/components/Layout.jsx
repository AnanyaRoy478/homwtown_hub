import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, Compass, CalendarDays, Bell, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Avatar } from './ui';

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1E6B5A" />
      <path d="M7 16 16 8l9 8v9H7z" fill="#F2A71B" />
      <rect x="13" y="18" width="6" height="7" rx="3" fill="#1E6B5A" />
    </svg>
    Hometown Hub
  </Link>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let live = true;
    const load = () => api.get('/notifications/unread-count').then((r) => live && setUnread(r.data.unread)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    const onRead = () => load();
    window.addEventListener('hh:notifications', onRead);
    return () => { live = false; clearInterval(t); window.removeEventListener('hh:notifications', onRead); };
  }, []);

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/events', label: 'Events', icon: CalendarDays },
    { to: '/notifications', label: 'Alerts', icon: Bell, badge: unread },
    { to: '/profile', label: 'Profile', icon: User },
  ];
  if (user?.role === 'admin') items.push({ to: '/admin', label: 'Admin', icon: Shield });

  const linkCls = ({ isActive }) =>
    `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-river-50 text-river-700' : 'text-ink/65 hover:bg-ink/5'}`;

  return (
    <div className="mx-auto min-h-screen max-w-6xl lg:flex lg:gap-6 lg:px-4">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-0 flex h-screen flex-col py-6">
          <Logo />
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className={linkCls}>
                <Icon className="h-5 w-5" /> {label === 'Alerts' ? 'Notifications' : label}
                {badge > 0 && <span className="ml-auto rounded-full bg-marigold-400 px-2 text-xs font-bold">{badge > 99 ? '99+' : badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3">
            <Avatar user={user} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-ink/55">{user?.hometown?.city || user?.email}</p>
            </div>
            <button onClick={() => { logout(); nav('/login'); }} className="rounded-md p-1.5 text-ink/50 hover:bg-ink/5" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <button onClick={() => { logout(); nav('/login'); }} className="btn-ghost !px-2 text-xs" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="px-4 pb-28 pt-4 lg:pb-10 lg:pt-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink/10 bg-white lg:hidden" aria-label="Main">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-river-700' : 'text-ink/55'}`}>
            <Icon className="h-5 w-5" />
            {label}
            {badge > 0 && <span className="absolute right-1/4 top-1 h-2.5 w-2.5 rounded-full bg-marigold-400" aria-label={`${badge} unread`} />}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
