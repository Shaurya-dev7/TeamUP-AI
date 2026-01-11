import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  // No title/description - keep admin invisible
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side auth check - returns 404 if not admin
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* No-cache header */}
      <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      
      <div className="flex">
        {/* Admin Sidebar */}
        <AdminSidebar currentRole={admin.role} />
        
        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
