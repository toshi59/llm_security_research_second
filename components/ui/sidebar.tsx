'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  List,
  Database,
  PlusCircle,
} from 'lucide-react';

const navItems = [
  {
    href: '/home',
    label: 'ホーム',
    icon: Home,
  },
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
  },
  {
    href: '/new-assessment',
    label: '新規評価',
    icon: PlusCircle,
  },
  {
    href: '/assessments',
    label: '評価一覧',
    icon: List,
  },
  {
    href: '/criteria',
    label: '観点マスタ',
    icon: Database,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-50 border-r border-slate-200">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-gray-800">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Assessment Recorder'}
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}