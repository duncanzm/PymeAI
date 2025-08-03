"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  ShoppingCart,
  Star,
  Sparkles,
  Brain,
  Activity,
  Target,
  Zap,
  Loader2,
  BarChart3,
  TrendingDown as TrendDown
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { validateClient, formatCedula, formatPhone, type ValidationError } from "@/lib/validations/client"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  totalSpent: number
  visitCount: number
  lastVisit: string | null
  averageSpent: number
  createdAt: string
  tags?: string | string[]
  aiAnalysis?: ClientAIAnalysis
}

interface ClientAIAnalysis {
  // Estado inteligente basado en el comportamiento del negocio
  status: {
    label: string
    confidence: number // Qué tan seguros estamos del análisis
    color: string
    variant: "default" | "destructive" | "secondary" | "outline"
    reason: string // Explicación del por qué
  }
  
  // Puntuaciones relativas al negocio
  scores: {
    engagement: number // 0-100: Qué tan comprometido está vs otros clientes
    value: number // 0-100: Valor relativo al promedio del negocio
    frequency: number // 0-100: Frecuencia de visitas vs promedio
    trend: number // -100 a 100: Tendencia negativa a positiva
    churnRisk: number // 0-100: Probabilidad de pérdida
  }
  
  // Predicciones basadas en patrones del negocio
  predictions: {
    nextVisitDays: number | null // En cuántos días debería volver
    nextVisitConfidence: number // Qué tan seguros estamos
    lifetimeValue: number // Valor proyectado basado en comportamiento similar
    churnDate: Date | null // Cuándo consideraríamos perdido al cliente
  }
  
  // Comparaciones con el negocio
  comparisons: {
    vsAverageSpend: number // % vs promedio del negocio
    vsAverageFrequency: number // % vs frecuencia promedio
    percentile: number // En qué percentil está este cliente
    similarClientsCount: number // Cuántos clientes tienen comportamiento similar
  }
  
  // Insights dinámicos
  insights: string[] // Observaciones específicas
  recommendations: string[] // Acciones sugeridas
  
  // Metadata
  lastAnalyzed: string
  modelVersion: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [analyzingClients, setAnalyzingClients] = useState(false)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [businessInsights, setBusinessInsights] = useState<BusinessInsights | null>(null)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    idType: "",
    idNumber: "",
    address: "",
    company: "",
    occupation: "",
    birthday: "",
    notes: "",
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  interface BusinessInsights {
    totalClients: number
    averageVisitFrequency: number // días promedio entre visitas
    averageSpend: number
    medianSpend: number
    topPercentileSpend: number // top 10% gastan esto o más
    averageLifetime: number // días promedio como cliente
    churnThreshold: number // después de cuántos días sin visitar se considera perdido
    seasonalPatterns: boolean
    bestDays: string[]
    bestHours: number[]
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        
        // Analizar clientes con AI automáticamente
        if (data.length > 0) {
          analyzeAllClients(data)
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAllClients = async (clientsData: Client[]) => {
    setAnalyzingClients(true)
    try {
      // Llamar a la API de análisis AI
      const response = await fetch('/api/ai/analyze-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clients: clientsData,
          requestInsights: true // Pedir insights del negocio también
        })
      })

      if (response.ok) {
        const result = await response.json()
        setClients(result.clients)
        setBusinessInsights(result.businessInsights)
      } else {
        // Si falla la AI, hacer análisis local básico
        performLocalAnalysis(clientsData)
      }
    } catch (error) {
      console.error('Error en análisis AI:', error)
      performLocalAnalysis(clientsData)
    } finally {
      setAnalyzingClients(false)
    }
  }

  // Análisis local inteligente (sin hardcodear valores)
  const performLocalAnalysis = (clientsData: Client[]) => {
    // Calcular métricas del negocio
    const activeClients = clientsData.filter(c => c.lastVisit)
    
    if (activeClients.length === 0) {
      return
    }

    // Calcular promedios del negocio
    const avgSpend = activeClients.reduce((sum, c) => sum + c.averageSpent, 0) / activeClients.length
    const avgVisits = activeClients.reduce((sum, c) => sum + c.visitCount, 0) / activeClients.length
    
    // Calcular frecuencias de visita
    const frequencies = activeClients.map(client => {
      if (!client.lastVisit || client.visitCount <= 1) return null
      const daysSinceCreated = Math.floor((new Date().getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreated / client.visitCount
    }).filter(f => f !== null) as number[]
    
    const avgFrequency = frequencies.length > 0 
      ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length 
      : 30

    // Analizar cada cliente en relación al negocio
    const analyzedClients = clientsData.map(client => {
      const analysis = analyzeClientRelativeToBusinessLocal(client, {
        avgSpend,
        avgVisits,
        avgFrequency,
        allClients: clientsData
      })
      
      return {
        ...client,
        aiAnalysis: analysis
      }
    })

    setClients(analyzedClients)

    // Establecer insights básicos del negocio
    setBusinessInsights({
      totalClients: clientsData.length,
      averageVisitFrequency: avgFrequency,
      averageSpend: avgSpend,
      medianSpend: avgSpend, // Simplificado
      topPercentileSpend: avgSpend * 2, // Simplificado
      averageLifetime: 180, // Simplificado
      churnThreshold: avgFrequency * 3, // 3x el promedio
      seasonalPatterns: false,
      bestDays: [],
      bestHours: []
    })
  }

  const analyzeClientRelativeToBusinessLocal = (
    client: Client, 
    businessMetrics: {
      avgSpend: number
      avgVisits: number
      avgFrequency: number
      allClients: Client[]
    }
  ): ClientAIAnalysis => {
    const { avgSpend, avgVisits, avgFrequency, allClients } = businessMetrics
    
    // Calcular días desde última visita
    const daysSinceLastVisit = client.lastVisit 
      ? Math.floor((new Date().getTime() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Calcular frecuencia personal del cliente
    const clientFrequency = client.visitCount > 1 && client.createdAt
      ? Math.floor((new Date().getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)) / client.visitCount
      : avgFrequency

    // Scores relativos al negocio
    const valueScore = Math.min(100, (client.averageSpent / avgSpend) * 50)
    const frequencyScore = Math.min(100, (avgFrequency / clientFrequency) * 50)
    const engagementScore = Math.min(100, (client.visitCount / avgVisits) * 50)
    
    // Calcular tendencia
    let trendScore = 0
    if (daysSinceLastVisit !== null) {
      const expectedDays = clientFrequency
      const deviation = (daysSinceLastVisit - expectedDays) / expectedDays
      trendScore = Math.max(-100, Math.min(100, -deviation * 50))
    }

    // Riesgo de pérdida basado en comportamiento relativo
    let churnRisk = 0
    if (daysSinceLastVisit !== null) {
      const deviationFactor = daysSinceLastVisit / clientFrequency
      if (deviationFactor > 3) churnRisk = 90
      else if (deviationFactor > 2) churnRisk = 70
      else if (deviationFactor > 1.5) churnRisk = 50
      else if (deviationFactor > 1) churnRisk = 30
      else churnRisk = 10
    }

    // Determinar estado basado en comportamiento relativo
    let status
    const insights: string[] = []
    const recommendations: string[] = []

    if (!client.lastVisit) {
      status = {
        label: 'Nuevo',
        confidence: 100,
        color: 'bg-blue-500',
        variant: 'default' as const,
        reason: 'Cliente sin historial de visitas'
      }
      insights.push('Cliente nuevo sin visitas registradas')
      recommendations.push('Registrar primera interacción')
    } else if (churnRisk > 70) {
      status = {
        label: 'Crítico',
        confidence: Math.round(churnRisk),
        color: 'bg-red-500',
        variant: 'destructive' as const,
        reason: `${daysSinceLastVisit} días sin visitar (esperado: cada ${Math.round(clientFrequency)} días)`
      }
      insights.push(`Ausencia ${Math.round(daysSinceLastVisit! / clientFrequency)}x más larga que su patrón habitual`)
      recommendations.push('Acción inmediata requerida para retención')
    } else if (churnRisk > 40) {
      status = {
        label: 'En riesgo',
        confidence: 75,
        color: 'bg-orange-500',
        variant: 'secondary' as const,
        reason: 'Desviación significativa de su patrón de visitas'
      }
      insights.push('Comportamiento irregular detectado')
      recommendations.push('Contactar con incentivo personalizado')
    } else if (engagementScore > 70 && valueScore > 70) {
      status = {
        label: 'VIP',
        confidence: 90,
        color: 'bg-purple-500',
        variant: 'default' as const,
        reason: 'Alto valor y alta frecuencia'
      }
      insights.push(`Gasta ${Math.round((client.averageSpent / avgSpend - 1) * 100)}% más que el promedio`)
      insights.push(`Visita ${Math.round((avgFrequency / clientFrequency - 1) * 100)}% más frecuente que el promedio`)
      recommendations.push('Mantener atención premium')
    } else {
      status = {
        label: 'Regular',
        confidence: 85,
        color: 'bg-green-500',
        variant: 'outline' as const,
        reason: 'Comportamiento estable'
      }
      insights.push('Cliente con patrón estable de visitas')
      recommendations.push('Mantener calidad de servicio')
    }

    // Calcular percentil
    const spendPercentile = (allClients.filter(c => c.averageSpent <= client.averageSpent).length / allClients.length) * 100

    // Predicción de próxima visita
    const predictedNextVisitDays = daysSinceLastVisit !== null 
      ? Math.max(0, clientFrequency - daysSinceLastVisit)
      : clientFrequency

    return {
      status,
      scores: {
        engagement: Math.round(engagementScore),
        value: Math.round(valueScore),
        frequency: Math.round(frequencyScore),
        trend: Math.round(trendScore),
        churnRisk: Math.round(churnRisk)
      },
      predictions: {
        nextVisitDays: Math.round(predictedNextVisitDays),
        nextVisitConfidence: 100 - churnRisk,
        lifetimeValue: client.averageSpent * (365 / clientFrequency) * 2, // Proyección a 2 años
        churnDate: daysSinceLastVisit !== null 
          ? new Date(Date.now() + (clientFrequency * 3 - daysSinceLastVisit) * 24 * 60 * 60 * 1000)
          : null
      },
      comparisons: {
        vsAverageSpend: Math.round((client.averageSpent / avgSpend - 1) * 100),
        vsAverageFrequency: Math.round((avgFrequency / clientFrequency - 1) * 100),
        percentile: Math.round(spendPercentile),
        similarClientsCount: allClients.filter(c => 
          Math.abs(c.averageSpent - client.averageSpent) / avgSpend < 0.2 &&
          Math.abs(c.visitCount - client.visitCount) / avgVisits < 0.2
        ).length - 1
      },
      insights,
      recommendations,
      lastAnalyzed: new Date().toISOString(),
      modelVersion: 'local-1.0'
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  )

  const formatLastVisit = (lastVisit: string | null, predictedDays?: number) => {
    if (!lastVisit) return "Sin visitas"
    
    const date = new Date(lastVisit)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let text = ""
    if (diffDays === 0) text = "Hoy"
    else if (diffDays === 1) text = "Ayer"
    else if (diffDays < 7) text = `Hace ${diffDays} días`
    else if (diffDays < 30) text = `Hace ${Math.floor(diffDays / 7)} semanas`
    else if (diffDays < 365) text = `Hace ${Math.floor(diffDays / 30)} meses`
    else text = `Hace ${Math.floor(diffDays / 365)} años`

    // Agregar predicción si existe
    if (predictedDays && predictedDays > 0) {
      text += ` • Esperado en ${predictedDays} días`
    }

    return text
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setNewClient({...newClient, phone: formatted})
  }

  const handleCedulaChange = (value: string) => {
    if (newClient.idType === 'cedula') {
      const formatted = formatCedula(value)
      setNewClient({...newClient, idNumber: formatted})
    } else {
      setNewClient({...newClient, idNumber: value})
    }
  }

  const handleCreateClient = async () => {
    const errors = validateClient(newClient)
    setValidationErrors(errors)

    if (errors.length > 0) {
      const firstError = errors[0]
      const element = document.getElementById(firstError.field)
      element?.focus()
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      if (response.ok) {
        const createdClient = await response.json()
        setClients([createdClient, ...clients])
        setShowNewClientDialog(false)
        setNewClient({ 
          name: "", email: "", phone: "", idType: "", idNumber: "", 
          address: "", company: "", occupation: "", birthday: "", 
          notes: "", tags: []
        })
        setTagInput("")
        setValidationErrors([])
        router.push(`/dashboard/clients/${createdClient.id}`)
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert("Error al crear el cliente")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Calcular estadísticas usando AI insights si están disponibles
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0)
  const activeClients = clients.filter(client => 
    client.aiAnalysis ? client.aiAnalysis.scores.churnRisk < 50 : false
  ).length
  const atRiskClients = clients.filter(client => 
    client.aiAnalysis ? client.aiAnalysis.scores.churnRisk >= 50 : false
  ).length
  const avgTicket = businessInsights?.averageSpend || 
    (clients.length > 0 ? totalRevenue / clients.reduce((sum, c) => sum + c.visitCount, 0) : 0)

  return (
    <div className="space-y-6">
      {/* Header con estadísticas inteligentes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
            {businessInsights && (
              <p className="text-xs text-blue-600">
                {businessInsights.totalClients > 100 ? 'Gran base de clientes' : 'En crecimiento'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900">{activeClients}</p>
            <p className="text-xs text-green-600">
              {clients.length > 0 ? `${Math.round((activeClients / clients.length) * 100)}% saludable` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-900">
              ₡{avgTicket >= 1000 ? `${Math.round(avgTicket / 1000)}k` : Math.round(avgTicket)}
            </p>
            {businessInsights && (
              <p className="text-xs text-purple-600">Por visita</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {analyzingClients ? 'Analizando...' : 'Clientes en Riesgo'}
              </CardTitle>
              {analyzingClients ? (
                <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-900">{atRiskClients}</p>
            <p className="text-xs text-amber-600">
              {atRiskClients > 0 ? 'Requieren atención' : 'Todo bien'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights del negocio con AI */}
      {businessInsights && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              Insights AI del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Frecuencia promedio de visitas</p>
                <p className="font-semibold">Cada {Math.round(businessInsights.averageVisitFrequency)} días</p>
              </div>
              <div>
                <p className="text-gray-600">Umbral de pérdida</p>
                <p className="font-semibold">{Math.round(businessInsights.churnThreshold)} días sin visitar</p>
              </div>
              <div>
                <p className="text-gray-600">Valor top 10%</p>
                <p className="font-semibold">₡{Math.round(businessInsights.topPercentileSpend).toLocaleString()}+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header de la sección */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-500">
            {analyzingClients ? 'Analizando comportamientos...' : 'Análisis inteligente activado'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => analyzeAllClients(clients)}
            disabled={analyzingClients}
          >
            {analyzingClients ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Re-analizar
              </>
            )}
          </Button>
          <Button onClick={() => setShowNewClientDialog(true)} className="shadow-lg">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Búsqueda mejorada */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base shadow-sm"
        />
      </div>

      {/* Lista de clientes con análisis AI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const status = client.aiAnalysis?.status || { 
            label: 'Sin analizar', 
            color: 'bg-gray-500', 
            variant: 'outline' as const 
          }
          
          const clientTags = typeof client.tags === 'string' 
            ? (client.tags ? JSON.parse(client.tags) : [])
            : (client.tags || [])
          
          const isVIP = client.aiAnalysis?.status.label === 'VIP' || 
            clientTags.some((tag: string) => 
              tag.toLowerCase().includes('vip') || 
              tag.toLowerCase().includes('oro') ||
              tag.toLowerCase().includes('premium')
            )
          
          return (
            <Card 
              key={client.id}
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${
                isVIP ? 'ring-2 ring-purple-400' : ''
              }`}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              {/* Indicador de estado superior */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${status.color}`} />
              
              {/* Indicador de riesgo si existe */}
              {client.aiAnalysis && client.aiAnalysis.scores.churnRisk > 50 && (
                <div className="absolute top-2 right-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">{client.name}</CardTitle>
                      {isVIP && <Star className="h-4 w-4 text-purple-500 fill-purple-500" />}
                    </div>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Cliente desde {new Date(client.createdAt).toLocaleDateString('es-CR', { month: 'short', year: 'numeric' })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                    {client.aiAnalysis && (
                      <span className="text-xs text-gray-500">
                        {status.confidence}% certeza
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Tags del cliente */}
                {clientTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clientTags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs ${
                          tag.toLowerCase().includes('vip') || 
                          tag.toLowerCase().includes('oro') ||
                          tag.toLowerCase().includes('premium')
                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                            : ''
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {clientTags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{clientTags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información de contacto con iconos */}
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs">
                      {formatLastVisit(
                        client.lastVisit, 
                        client.aiAnalysis?.predictions.nextVisitDays
                      )}
                    </span>
                  </div>
                </div>

                {/* Scores AI visuales */}
                {client.aiAnalysis && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Engagement</span>
                          <span className="font-medium">{client.aiAnalysis.scores.engagement}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                            style={{ width: `${client.aiAnalysis.scores.engagement}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Valor</span>
                          <span className="font-medium">{client.aiAnalysis.scores.value}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                            style={{ width: `${client.aiAnalysis.scores.value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Métricas mejoradas con comparaciones */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {client.visitCount}
                    </p>
                    <p className="text-xs text-gray-500">Visitas</p>
                    {client.aiAnalysis && (
                      <p className="text-xs text-gray-400">
                        P{client.aiAnalysis.comparisons.percentile}
                      </p>
                    )}
                  </div>
                  <div className="text-center border-x">
                    <p className="text-2xl font-bold text-gray-900">
                      {client.averageSpent >= 1000 
                        ? `${Math.round(client.averageSpent / 1000)}k` 
                        : Math.round(client.averageSpent)}
                    </p>
                    <p className="text-xs text-gray-500">Promedio</p>
                    {client.aiAnalysis && client.aiAnalysis.comparisons.vsAverageSpend !== 0 && (
                      <p className={`text-xs ${
                        client.aiAnalysis.comparisons.vsAverageSpend > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {client.aiAnalysis.comparisons.vsAverageSpend > 0 ? '+' : ''}
                        {client.aiAnalysis.comparisons.vsAverageSpend}%
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {client.aiAnalysis?.scores.churnRisk || 0}%
                    </p>
                    <p className="text-xs text-gray-500">Riesgo</p>
                    {client.aiAnalysis && (
                      <div className={`text-xs ${
                        client.aiAnalysis.scores.churnRisk > 70 ? 'text-red-600' :
                        client.aiAnalysis.scores.churnRisk > 40 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {client.aiAnalysis.scores.churnRisk > 70 ? 'Alto' :
                         client.aiAnalysis.scores.churnRisk > 40 ? 'Medio' : 'Bajo'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Insight principal */}
                {client.aiAnalysis && client.aiAnalysis.insights.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 italic flex items-start gap-1">
                      <Sparkles className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                      {client.aiAnalysis.insights[0]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No se encontraron clientes</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
          </p>
        </div>
      )}

      {/* Modal para nuevo cliente (sin cambios) */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Completa la información del cliente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Todos los campos del formulario siguen igual... */}
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="Juan Pérez"
                className={getFieldError('name') ? 'border-red-500' : ''}
              />
              {getFieldError('name') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('name')}
                </p>
              )}
            </div>
            
            {/* Tipo de ID */}
            <div className="space-y-2">
              <Label htmlFor="idType">Tipo de identificación</Label>
              <select
                id="idType"
                className={`w-full rounded-md border ${getFieldError('idType') ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm`}
                value={newClient.idType}
                onChange={(e) => setNewClient({...newClient, idType: e.target.value})}
              >
                <option value="">Seleccionar tipo</option>
                <option value="cedula">Cédula</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="residencia">Residencia</option>
                <option value="otro">Otro</option>
              </select>
              {getFieldError('idType') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('idType')}
                </p>
              )}
            </div>
            
            {/* Número de ID */}
            <div className="space-y-2">
              <Label htmlFor="idNumber">Número de identificación</Label>
              <Input
                id="idNumber"
                value={newClient.idNumber}
                onChange={(e) => handleCedulaChange(e.target.value)}
                placeholder={newClient.idType === 'cedula' ? '1-2345-6789' : 'Número de ID'}
                className={getFieldError('idNumber') ? 'border-red-500' : ''}
              />
              {getFieldError('idNumber') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('idNumber')}
                </p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                placeholder="cliente@email.com"
                className={getFieldError('email') ? 'border-red-500' : ''}
              />
              {getFieldError('email') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('email')}
                </p>
              )}
            </div>
            
            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={newClient.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="8888-8888 o +506 8888-8888"
                className={getFieldError('phone') ? 'border-red-500' : ''}
              />
              {getFieldError('phone') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('phone')}
                </p>
              )}
            </div>
            
            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="birthday">Fecha de nacimiento</Label>
              <Input
                id="birthday"
                type="date"
                value={newClient.birthday}
                onChange={(e) => setNewClient({...newClient, birthday: e.target.value})}
                max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                className={getFieldError('birthday') ? 'border-red-500' : ''}
              />
              {getFieldError('birthday') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('birthday')}
                </p>
              )}
            </div>
            
            {/* Dirección */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={newClient.address}
                onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                placeholder="Dirección completa"
                className={getFieldError('address') ? 'border-red-500' : ''}
                maxLength={200}
              />
              {getFieldError('address') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('address')}
                </p>
              )}
            </div>
            
            {/* Ocupación */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={newClient.occupation}
                onChange={(e) => setNewClient({...newClient, occupation: e.target.value})}
                placeholder="Profesión u ocupación"
                className={getFieldError('occupation') ? 'border-red-500' : ''}
                maxLength={100}
              />
              {getFieldError('occupation') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('occupation')}
                </p>
              )}
            </div>
            
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input
                id="company"
                value={newClient.company}
                onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                placeholder="Lugar de trabajo"
                className={getFieldError('company') ? 'border-red-500' : ''}
                maxLength={100}
              />
              {getFieldError('company') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('company')}
                </p>
              )}
            </div>
            
            {/* Etiquetas */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Etiquetas {newClient.tags.length}/10</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Agregar etiqueta"
                  disabled={newClient.tags.length >= 10}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (tagInput.trim() && newClient.tags.length < 10) {
                        setNewClient({
                          ...newClient, 
                          tags: [...newClient.tags, tagInput.trim()]
                        })
                        setTagInput("")
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!tagInput.trim() || newClient.tags.length >= 10}
                  onClick={() => {
                    if (tagInput.trim() && newClient.tags.length < 10) {
                      setNewClient({
                        ...newClient, 
                        tags: [...newClient.tags, tagInput.trim()]
                      })
                      setTagInput("")
                    }
                  }}
                >
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newClient.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                    <button
                      className="ml-1 text-xs hover:text-red-500"
                      onClick={() => {
                        setNewClient({
                          ...newClient,
                          tags: newClient.tags.filter((_, i) => i !== index)
                        })
                      }}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              {getFieldError('tags') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('tags')}
                </p>
              )}
            </div>
            
            {/* Notas */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notas ({newClient.notes.length}/500)</Label>
              <Textarea
                id="notes"
                value={newClient.notes}
                onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
                maxLength={500}
                className={getFieldError('notes') ? 'border-red-500' : ''}
              />
              {getFieldError('notes') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('notes')}
                </p>
              )}
            </div>
          </div>
          
          {validationErrors.length > 3 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600 font-medium">
                Hay {validationErrors.length} errores en el formulario. Por favor, revisa los campos marcados.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewClientDialog(false)
                setNewClient({ 
                  name: "", email: "", phone: "", idType: "", idNumber: "", 
                  address: "", company: "", occupation: "", birthday: "", 
                  notes: "", tags: []
                })
                setTagInput("")
                setValidationErrors([])
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClient}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}