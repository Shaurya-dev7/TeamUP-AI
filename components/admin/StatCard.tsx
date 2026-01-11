import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'green' | 'cyan' | 'red' | 'yellow';
  href?: string;
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-950/50 border-blue-800 text-blue-400',
  purple: 'bg-purple-950/50 border-purple-800 text-purple-400',
  green: 'bg-green-950/50 border-green-800 text-green-400',
  cyan: 'bg-cyan-950/50 border-cyan-800 text-cyan-400',
  red: 'bg-red-950/50 border-red-800 text-red-400',
  yellow: 'bg-yellow-950/50 border-yellow-800 text-yellow-400',
};

const iconColorClasses = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  green: 'bg-green-600',
  cyan: 'bg-cyan-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-600',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  href,
  subtitle 
}: StatCardProps) {
  const content = (
    <div className={`
      p-6 rounded-xl border transition-all
      ${colorClasses[color]}
      ${href ? 'hover:scale-[1.02] cursor-pointer' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
