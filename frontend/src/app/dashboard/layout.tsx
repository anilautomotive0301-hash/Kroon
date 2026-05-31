'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout, getStoredUser } from '@/lib/auth';
import type { User } from '@/types';
import {
  BarChart3,
  Building2,
  CheckSquare,
  LogOut,
  Package,
  Scissors,
  Send,
  ShoppingBag,
  Users,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3, exact: true, roles: ['ADMIN', 'SUPERVISOR', 'FIELD_STAFF', 'TAILOR', 'ACCOUNTANT'] },
  { href: '/dashboard/campus', label: 'Campus', icon: Building2, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/dashboard/students', label: 'Students', icon: Users, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/dashboard/measurements', label: 'Measurements', icon: Ruler, roles: ['ADMIN', 'SUPERVISOR', 'FIELD_STAFF'] },
  { href: '/dashboard/workflow', label: 'Workflow', icon: CheckSquare, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/dashboard/production', label: 'Production', icon: Scissors, roles: ['ADMIN', 'SUPERVISOR', 'TAILOR'] },
  { href: '/dashboard/dispatch', label: 'Dispatch', icon: Send, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/dashboard/payments', label: 'Payments', icon: ShoppingBag, roles: ['ADMIN', 'ACCOUNTANT'] },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR', 'ACCOUNTANT'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [navItems, setNavItems] = useState(ALL_NAV_ITEMS);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setUser(stored);
    setNavItems(ALL_NAV_ITEMS.filter(item => item.roles.includes(stored.role)));
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Kroon</h1>
          <p className="text-xs text-gray-400 mt-0.5">Uniform ERP</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
