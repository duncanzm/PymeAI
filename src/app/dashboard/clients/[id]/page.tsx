"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Clock,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Edit,
  Save,
  X,
  Plus,
  User,
  MapPin,
  Building,
  Tag,
  BarChart as BarChartIcon,
  Activity
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { validateClient, formatCedula, formatPhone, type ValidationError } from "@/lib/validations/client"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  idNumber?: string | null
  idType?: string | null
  totalSpent: number
  visitCount: number
  lastVisit: string | null
  averageSpent: number
  createdAt: string
  // Campos adicionales
  address?: string
  company?: string
  occupation?: string
  birthday?: string
  tags?: string[]
  notes?: string
}

interface Interaction {
  id: string
  type: string
  amount: number | null
  notes: string | null
  date: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [editedClient, setEditedClient] = useState<Client | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [tagInput, setTagInput] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // Datos para gráficas
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([])
  const [visitFrequency, setVisitFrequency] = useState<any[]>([])

  // Función simple para detectar cambios
  const hasChanges = () => {
    if (!client || !editedClient || !isEditing) return false
    
    // Comparar solo campos editables
    const clientToCompare = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      idNumber: client.idNumber,
      idType: client.idType,
      address: client.address,
      company: client.company,
      occupation: client.occupation,
      birthday: client.birthday,
      tags: JSON.stringify(client.tags || []),
      notes: client.notes
    }
    
    const editedToCompare = {
      name: editedClient.name,
      email: editedClient.email,
      phone: editedClient.phone,
      idNumber: editedClient.idNumber,
      idType: editedClient.idType,
      address: editedClient.address,
      company: editedClient.company,
      occupation: editedClient.occupation,
      birthday: editedClient.birthday,
      tags: JSON.stringify(editedClient.tags || []),
      notes: editedClient.notes
    }
    
    return JSON.stringify(clientToCompare) !== JSON.stringify(editedToCompare)
  }

  const fetchClientData = async () => {
    console.log('Fetching client with ID:', clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Client data received:', data)
        const clientData: Client = {
          ...data,
          tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags || []
        }
        setClient(clientData)
        setEditedClient({...clientData})
        generateChartData(clientData)
      } else if (response.status === 404) {
        console.log('Client not found (404)')
        setClient(null)
      } else {
        console.error('Error response:', response.status)
        setClient(null)
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      setClient(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchInteractions = async () => {
    try {
      const response = await fetch(`/api/interactions?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateChartData = (clientData: Client) => {
    // Simular historial de compras para la gráfica
    const lastSixMonths = []
    const today = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      lastSixMonths.push({
        month: date.toLocaleDateString('es-CR', { month: 'short' }),
        amount: Math.floor(Math.random() * 50000) + 10000
      })
    }
    setPurchaseHistory(lastSixMonths)
    
    // Simular frecuencia de visitas
    const visitData = [
      { day: 'Lun', visits: Math.floor(Math.random() * 5) },
      { day: 'Mar', visits: Math.floor(Math.random() * 5) },
      { day: 'Mié', visits: Math.floor(Math.random() * 5) },
      { day: 'Jue', visits: Math.floor(Math.random() * 5) },
      { day: 'Vie', visits: Math.floor(Math.random() * 5) },
      { day: 'Sáb', visits: Math.floor(Math.random() * 5) },
      { day: 'Dom', visits: Math.floor(Math.random() * 5) }
    ]
    setVisitFrequency(visitData)
  }

  useEffect(() => {
    fetchClientData()
    fetchInteractions()
  }, [clientId])

  const handleSave = async () => {
    if (!editedClient || isSaving) return
    
    // Validar antes de guardar
    const errors = validateClient(editedClient)
    setValidationErrors(errors)

    if (errors.length > 0) {
      // Enfocar el primer campo con error
      const firstError = errors[0]
      const element = document.getElementById(firstError.field)
      element?.focus()
      return
    }

    setIsSaving(true)

    try {
      const dataToSend = {
        ...editedClient,
        tags: JSON.stringify(editedClient.tags || [])
      }
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        const updatedData = await response.json()
        const clientData: Client = {
          ...updatedData,
          tags: typeof updatedData.tags === 'string' ? JSON.parse(updatedData.tags) : updatedData.tags || []
        }
        setClient(clientData)
        setEditedClient({...clientData})
        setIsEditing(false)
        setValidationErrors([])
      } else {
        alert('Error al guardar los cambios')
      }
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges()) {
      if (!confirm("¿Estás seguro de que quieres descartar los cambios sin guardar?")) {
        return
      }
    }
    setIsEditing(false)
    if (client) {
      setEditedClient({...client} as Client)
    }
    setTagInput("")
    setValidationErrors([])
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setEditedClient({...editedClient!, phone: formatted})
  }

  const handleCedulaChange = (value: string) => {
    if (editedClient?.idType === 'cedula') {
      const formatted = formatCedula(value)
      setEditedClient({...editedClient!, idNumber: formatted})
    } else {
      setEditedClient({...editedClient!, idNumber: value})
    }
  }

  const calculateMetrics = () => {
    if (!client) return { riskLevel: 'bajo', daysSinceLastVisit: 0, status: 'activo' }
    
    const lastVisitDate = client.lastVisit ? new Date(client.lastVisit) : new Date()
    const daysSinceLastVisit = Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let riskLevel = 'bajo'
    let status = 'activo'
    
    if (daysSinceLastVisit > 60) {
      riskLevel = 'alto'
      status = 'inactivo'
    } else if (daysSinceLastVisit > 30) {
      riskLevel = 'medio'
      status = 'en riesgo'
    }
    
    return { riskLevel, daysSinceLastVisit, status }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold">Cliente no encontrado</h2>
        <p className="text-gray-500">El cliente que buscas no existe o fue eliminado.</p>
        <Button onClick={() => router.push('/dashboard/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a clientes
        </Button>
      </div>
    )
  }

  const metrics = calculateMetrics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/clients')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-gray-500">Cliente desde {new Date(client.createdAt).toLocaleDateString('es-CR')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tags del cliente */}
          {client.tags && client.tags.length > 0 && (
            <div className="flex gap-2 mr-2">
              {client.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index}
                  className={
                    tag.toLowerCase().includes('vip') || 
                    tag.toLowerCase().includes('oro') ||
                    tag.toLowerCase().includes('premium')
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : ''
                  }
                >
                  {tag}
                </Badge>
              ))}
              {client.tags.length > 3 && (
                <Badge variant="outline">+{client.tags.length - 3}</Badge>
              )}
            </div>
          )}
          
          <Badge 
            variant={metrics.status === 'inactivo' ? 'destructive' : metrics.status === 'en riesgo' ? 'secondary' : 'outline'}
          >
            {metrics.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{client.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: ₡{client.averageSpent.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.visitCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(client.visitCount / 30)} por mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Visita</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.daysSinceLastVisit}</div>
            <p className="text-xs text-muted-foreground">días atrás</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riesgo de Pérdida</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{metrics.riskLevel}</div>
            <div className={`h-2 w-full rounded-full mt-2 ${
              metrics.riskLevel === 'alto' ? 'bg-red-500' : 
              metrics.riskLevel === 'medio' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs con información detallada */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="actions">Acciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Cliente</CardTitle>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      {hasChanges() && (
                        <span className="text-sm text-yellow-600">• Sin guardar</span>
                      )}
                      <Button 
                        onClick={handleCancel} 
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        size="sm"
                        disabled={isSaving}
                        type="button"
                      >
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => {
                      if (client) {
                        setIsEditing(true)
                        setEditedClient({...client} as Client) // Asegurar el tipo
                        setValidationErrors([])
                      }
                    }} size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <div className="space-y-8">
                  {/* Información Personal */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <User className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Información Personal</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                        <Input
                          id="name"
                          value={editedClient?.name || ''}
                          onChange={(e) => setEditedClient({...editedClient!, name: e.target.value})}
                          className={`${getFieldError('name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'} focus:ring-2`}
                          placeholder="Ej: Juan Pérez"
                        />
                        {getFieldError('name') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError('name')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Identificación</label>
                        <div className="flex gap-2">
                          <select
                            className="w-1/3 rounded-md border border-gray-200 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            value={editedClient?.idType || ''}
                            onChange={(e) => setEditedClient({...editedClient!, idType: e.target.value})}
                          >
                            <option value="">Tipo</option>
                            <option value="cedula">Cédula</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="residencia">Residencia</option>
                            <option value="otro">Otro</option>
                          </select>
                          <Input
                            id="idNumber"
                            value={editedClient?.idNumber || ''}
                            onChange={(e) => handleCedulaChange(e.target.value)}
                            placeholder="Número"
                            className={`flex-1 ${getFieldError('idNumber') ? 'border-red-500' : 'border-gray-200'}`}
                          />
                        </div>
                        {getFieldError('idNumber') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError('idNumber')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Ocupación</label>
                        <Input
                          value={editedClient?.occupation || ''}
                          onChange={(e) => setEditedClient({...editedClient!, occupation: e.target.value})}
                          placeholder="Ej: Ingeniero de Software"
                          className="border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Empresa</label>
                        <Input
                          value={editedClient?.company || ''}
                          onChange={(e) => setEditedClient({...editedClient!, company: e.target.value})}
                          placeholder="Lugar de trabajo (opcional)"
                          className="border-gray-200"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                        <Input
                          type="date"
                          value={editedClient?.birthday || ''}
                          onChange={(e) => setEditedClient({...editedClient!, birthday: e.target.value})}
                          className="border-gray-200 max-w-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Información de Contacto</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                        <Input
                          id="phone"
                          value={editedClient?.phone || ''}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="+506 0000-0000"
                          className={`${getFieldError('phone') ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {getFieldError('phone') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError('phone')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                          id="email"
                          type="email"
                          value={editedClient?.email || ''}
                          onChange={(e) => setEditedClient({...editedClient!, email: e.target.value})}
                          placeholder="cliente@email.com"
                          className={`${getFieldError('email') ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {getFieldError('email') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError('email')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Dirección</label>
                        <Input
                          value={editedClient?.address || ''}
                          onChange={(e) => setEditedClient({...editedClient!, address: e.target.value})}
                          placeholder="Dirección completa"
                          className="border-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Tag className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Etiquetas</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Agregar etiqueta"
                          className="border-gray-200"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (tagInput.trim() && editedClient) {
                                setEditedClient({
                                  ...editedClient,
                                  tags: [...(editedClient.tags || []), tagInput.trim()]
                                })
                                setTagInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (tagInput.trim() && editedClient) {
                              setEditedClient({
                                ...editedClient,
                                tags: [...(editedClient.tags || []), tagInput.trim()]
                              })
                              setTagInput("")
                            }
                          }}
                        >
                          Agregar
                        </Button>
                      </div>
                      
                      {editedClient?.tags && editedClient.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                          {editedClient.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {tag}
                              <button
                                className="ml-2 text-xs hover:text-red-500 transition-colors"
                                onClick={() => {
                                  if (editedClient) {
                                    setEditedClient({
                                      ...editedClient,
                                      tags: editedClient.tags?.filter((_, i) => i !== index) || []
                                    })
                                  }
                                }}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <MessageSquare className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Notas</h3>
                    </div>
                    
                    <Textarea
                      value={editedClient?.notes || ''}
                      onChange={(e) => setEditedClient({...editedClient!, notes: e.target.value})}
                      placeholder="Agregar notas sobre el cliente..."
                      rows={4}
                      className="border-gray-200 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Información Personal */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre completo</label>
                        <p className="text-base font-medium text-gray-900">{client.name}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</label>
                        <p className="text-base font-medium text-gray-900">
                          {client.idType && client.idNumber 
                            ? `${client.idType === 'cedula' ? 'Cédula' : 
                                client.idType === 'pasaporte' ? 'Pasaporte' : 
                                client.idType === 'residencia' ? 'Residencia' : 'ID'}: ${client.idNumber}`
                            : 'No registrada'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ocupación</label>
                        <p className="text-base font-medium text-gray-900">{client.occupation || 'No especificada'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</label>
                        <p className="text-base font-medium text-gray-900">{client.company || 'No especificada'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de nacimiento</label>
                        <p className="text-base font-medium text-gray-900">
                          {client.birthday 
                            ? new Date(client.birthday).toLocaleDateString('es-CR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            : 'No registrada'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente desde</label>
                        <p className="text-base font-medium text-gray-900">
                          {new Date(client.createdAt).toLocaleDateString('es-CR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-lg">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Información de Contacto</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</label>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-gray-900">{client.phone || 'No registrado'}</p>
                          {client.phone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => window.location.href = `tel:${client.phone}`}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium text-gray-900">{client.email || 'No registrado'}</p>
                          {client.email && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => window.location.href = `mailto:${client.email}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</label>
                        <p className="text-base font-medium text-gray-900">{client.address || 'No registrada'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white rounded-lg">
                        <Tag className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Etiquetas</h3>
                    </div>
                    
                    {client.tags && client.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay etiquetas asignadas</p>
                    )}
                  </div>

                  {/* Notas */}
                  {client.notes && (
                    <div className="bg-amber-50 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg">
                          <MessageSquare className="h-5 w-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Notas</h3>
                      </div>
                      
                      <p className="text-base text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">{client.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Interacciones</CardTitle>
              <CardDescription>
                Todas las interacciones con este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        interaction.type === 'purchase' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {interaction.type === 'purchase' ? (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {interaction.type === 'purchase' ? 'Compra' : 'Nota'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(interaction.date).toLocaleDateString('es-CR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {interaction.amount && (
                        <p className="font-bold">₡{interaction.amount.toLocaleString()}</p>
                      )}
                      {interaction.notes && (
                        <p className="text-sm text-gray-500">{interaction.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {interactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay interacciones registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Compras</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={purchaseHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frecuencia de Visitas</CardTitle>
                <CardDescription>Por día de la semana</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={visitFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Comportamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Frecuencia de compra</span>
                  <Badge>Cada {Math.round(30 / (client.visitCount / 12))} días</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Categoría preferida</span>
                  <Badge variant="outline">Café Premium</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Hora preferida</span>
                  <Badge variant="outline">10:00 AM - 12:00 PM</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor del cliente</span>
                  <Badge variant={client.totalSpent > 100000 ? "default" : "secondary"}>
                    {client.totalSpent > 100000 ? 'Alto valor' : 'Valor medio'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones y Seguimiento</CardTitle>
              <CardDescription>
                Gestiona las actividades con este cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Nueva Interacción
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Tareas Pendientes</h4>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay tareas pendientes
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Recordatorios</h4>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay recordatorios
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className={`border-2 ${
                metrics.riskLevel === 'alto' ? 'border-red-500' : 
                metrics.riskLevel === 'medio' ? 'border-yellow-500' : 'border-green-500'
              }`}>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2">Recomendaciones</h4>
                  <div className="space-y-2">
                    {metrics.riskLevel === 'alto' ? (
                      <>
                        <p className="text-sm">⚠️ Cliente en alto riesgo de pérdida</p>
                        <p className="text-sm">💡 Envía una oferta especial o descuento</p>
                        <p className="text-sm">📞 Realiza una llamada de seguimiento</p>
                      </>
                    ) : client.tags?.some(tag => 
                        tag.toLowerCase().includes('vip') || 
                        tag.toLowerCase().includes('oro') ||
                        tag.toLowerCase().includes('premium')
                      ) ? (
                      <>
                        <p className="text-sm">🌟 Cliente importante - Mantén el excelente servicio</p>
                        <p className="text-sm">🎁 Considera beneficios exclusivos</p>
                        <p className="text-sm">📊 Solicita feedback para mejorar</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">✅ Cliente activo y saludable</p>
                        <p className="text-sm">📈 Oportunidad de aumentar ticket promedio</p>
                        <p className="text-sm">🎯 Recomienda productos complementarios</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}