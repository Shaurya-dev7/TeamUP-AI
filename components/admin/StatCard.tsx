import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'gold' | 'crimson' | 'blue' | 'purple' | 'green' | 'cyan' | 'red' | 'yellow' | 'emerald';
  href?: string;
  subtitle?: string;
  glowing?: boolean;
}

const colorClasses = {
  gold: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400 group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-amber-500/20',
  crimson: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-400 group-hover:border-rose-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-rose-500/20',
  blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400 group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-blue-500/20',
  purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-400 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-purple-500/20',
  green: 'from-green-500/10 to-transparent border-green-500/20 text-green-400 group-hover:border-green-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-green-500/20',
  emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-emerald-500/20',
  cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-cyan-500/20',
  red: 'from-red-500/10 to-transparent border-red-500/20 text-red-400 group-hover:border-red-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-red-500/20',
  yellow: 'from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-400 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-yellow-500/20',
};

const iconBgClasses = {
  gold: 'bg-amber-500/20 text-amber-400',
  crimson: 'bg-rose-500/20 text-rose-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  green: 'bg-green-500/20 text-green-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  red: 'bg-red-500/20 text-red-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  href,
  subtitle,
  glowing = false,
}: StatCardProps) {
  
  const content = (
    <div className={`
      relative group overflow-hidden rounded-2xl border bg-gradient-to-br transition-all duration-300
      backdrop-blur-md bg-neutral-950/40 p-6 flex flex-col justify-between
      ${colorClasses[color]}
      ${href ? 'cursor-pointer hover:-translate-y-1' : ''}
      ${glowing ? 'animate-pulse shadow-lg' : ''}
    `}>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-neutral-400 font-medium tracking-wide uppercase">{title}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-2 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${iconBgClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative gradient blur in background */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${iconBgClasses[color].split(' ')[0]}`} />
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-2xl">{content}</Link>;
  }

  return content;
}
