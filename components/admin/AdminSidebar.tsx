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
} from 'lucide-react';

interface AdminSidebarProps {
  currentRole: AdminRole;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'moderator'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['super_admin', 'admin', 'moderator'] },
  { href: '/admin/teams', label: 'Teams', icon: UsersRound, roles: ['super_admin', 'admin', 'moderator'] },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, roles: ['super_admin', 'admin', 'moderator'] },
  { href: '/admin/system', label: 'System', icon: Settings, roles: ['super_admin'] },
  { href: '/admin/admins', label: 'Admins', icon: Shield, roles: ['super_admin'] },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText, roles: ['super_admin', 'admin'] },
];

export function AdminSidebar({ currentRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(item => 
    item.roles.includes(currentRole)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">TeamUp Admin</h1>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">{currentRole.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-red-600 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}
