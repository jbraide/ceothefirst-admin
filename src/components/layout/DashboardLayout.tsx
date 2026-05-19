import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* ─── Sidebar ──────────────────────────────────────── */}
      <Sidebar />

      {/* ─── Main content ─────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
