'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminRole } from '@/lib/admin/auth';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  AlertTriangle,
  Settings,
  Shield,
  ScrollText,
  ChevronLeft,
  Megaphone,
  BarChart3,
} from 'lucide-react';

interface AdminSidebarProps {
  currentRole: AdminRole;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'senior_moderator'] },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['super_admin', 'admin', 'senior_moderator'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['super_admin', 'admin', 'senior_moderator'] },
  { href: '/admin/teams', label: 'Teams', icon: UsersRound, roles: ['super_admin', 'admin', 'senior_moderator'] },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, roles: ['super_admin', 'admin', 'senior_moderator', 'moderator'] },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, roles: ['super_admin', 'admin'] },
  { href: '/admin/system', label: 'System', icon: Settings, roles: ['super_admin'] },
  { href: '/admin/admins', label: 'Admins', icon: Shield, roles: ['super_admin'] },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText, roles: ['super_admin', 'admin', 'senior_moderator'] },
];

export function AdminSidebar({ currentRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(item => 
    item.roles.includes(currentRole)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950/95 backdrop-blur-xl border-r border-neutral-800/50 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">TeamUp</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-semibold">{currentRole.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || 
            (pathname !== null && item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white shadow-lg shadow-red-500/10' 
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200'
                }
              `}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : ''}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800/50">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-300 transition-all duration-200"
        >
          <ChevronLeft className="w-[18px] h-[18px]" />
          <span className="font-medium text-sm">Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}
