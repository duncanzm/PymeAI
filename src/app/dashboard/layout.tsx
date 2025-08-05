import Link from "next/link"
import { LayoutDashboard, Users, Settings, BarChart3, GitBranch } from "lucide-react"
import AIChatWidget from "@/components/AIChatWidget"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-800">Mi CRM</h1>
          </div>
          <nav className="mt-8">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/clients"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Users className="mr-3 h-5 w-5" />
              Clientes
            </Link>
            <Link
              href="/dashboard/pipeline"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <GitBranch className="mr-3 h-5 w-5" />
              Pipeline
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Analytics
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Settings className="mr-3 h-5 w-5" />
              Configuración
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Chat Widget - FUERA del div principal */}
      <AIChatWidget />
    </>
  )
}