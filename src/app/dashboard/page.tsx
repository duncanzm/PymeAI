"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Users, TrendingUp, AlertCircle, Sparkles, Loader2, RefreshCw } from "lucide-react"
import SalesPredictionChart from "@/components/SalesPredictionChart"

interface DailySummary {
  summary: string
  metrics: {
    totalSales: number
    customerCount: number
    averageTicket: number
    newCustomers: number
    returningCustomers: number
  }
}

export default function DashboardPage() {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [stats, setStats] = useState({
    ventasHoy: 0,
    clientesHoy: 0,
    ticketPromedio: 0,
    clientesEnRiesgo: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Obtener clientes para calcular en riesgo
      const clientsResponse = await fetch('/api/clients')
      const clients = await clientsResponse.json()
      
      // Calcular clientes en riesgo (no han venido en más de 30 días)
      const atRiskCount = clients.filter((client: any) => {
        if (!client.lastVisit) return false
        const daysSinceLastVisit = Math.floor(
          (new Date().getTime() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceLastVisit > 30
      }).length

      setStats(prev => ({ ...prev, clientesEnRiesgo: atRiskCount }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const generateDailySummary = async () => {
    setLoadingSummary(true)
    try {
      const response = await fetch('/api/ai/daily-summary', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDailySummary(data)
        
        // Actualizar estadísticas con los datos reales
        setStats({
          ventasHoy: data.metrics.totalSales,
          clientesHoy: data.metrics.customerCount,
          ticketPromedio: data.metrics.averageTicket,
          clientesEnRiesgo: stats.clientesEnRiesgo // Mantener el valor anterior
        })
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Título de la página */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-gray-600">Resumen de tu negocio hoy</p>
      </div>

      {/* Resumen de IA */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Resumen Inteligente del Día
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateDailySummary}
              disabled={loadingSummary}
            >
              {loadingSummary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generar Resumen
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Análisis impulsado por IA de tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailySummary ? (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {dailySummary.summary}
              </p>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Clientes nuevos hoy:</span>
                    <span className="ml-2 font-semibold">{dailySummary.metrics.newCustomers}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Clientes que regresaron:</span>
                    <span className="ml-2 font-semibold">{dailySummary.metrics.returningCustomers}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">
                Haz clic en "Generar Resumen" para obtener insights de IA sobre tu día
              </p>
              <Button onClick={generateDailySummary} disabled={loadingSummary}>
                {loadingSummary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando datos...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Mi Primer Resumen
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Ventas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{stats.ventasHoy.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              {stats.ventasHoy > 0 ? 'Actualizado con IA' : 'Sin ventas aún'}
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Hoy
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesHoy}</div>
            <p className="text-xs text-gray-600">
              {stats.clientesHoy > 0 ? 'Únicos atendidos' : 'Registra interacciones'}
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Ticket Promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{stats.ticketPromedio.toLocaleString()}</div>
            <p className="text-xs text-gray-600">Por cliente</p>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Alertas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes en Riesgo
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesEnRiesgo}</div>
            <p className="text-xs text-orange-600">
              {stats.clientesEnRiesgo > 0 ? 'Necesitan atención' : 'Todo bien'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Predicción de Ventas con IA */}
      <SalesPredictionChart />

      {/* Sección de próximas características */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">Predicciones de Ventas</h4>
                <p className="text-sm text-gray-600">
                  La IA predecirá tus ventas de los próximos 7 días
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Análisis de Clientes</h4>
                <p className="text-sm text-gray-600">
                  Insights detallados de cada cliente con IA
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}