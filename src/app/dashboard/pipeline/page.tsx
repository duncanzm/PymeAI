"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Settings, 
  Plus,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Grip,
  ArrowLeft,
  Calendar,
  Clock,
  UserPlus,
  Search,
  Trash2,
  MoreVertical,
  Edit,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Stage {
  id: string
  name: string
  description: string
  color: string
  order: number
  isDefault: boolean
  _count: {
    clients: number
  }
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  totalSpent: number
  visitCount: number
  lastVisit: string | null
  averageSpent: number
  tags: string
  stageId: string | null
  stageEnteredAt: string | null
}

export default function PipelinePage() {
  const router = useRouter()
  const [stages, setStages] = useState<Stage[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedClient, setDraggedClient] = useState<Client | null>(null)
  
  // Modal states - Clientes existentes
  const [showExistingClientsModal, setShowExistingClientsModal] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [addingClients, setAddingClients] = useState(false)
  
  // Remove from pipeline states
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false)
  const [clientToRemove, setClientToRemove] = useState<Client | null>(null)
  const [removing, setRemoving] = useState(false)

  // Stage configuration states
  const [showStageConfigModal, setShowStageConfigModal] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    color: '#6B7280'
  })
  const [stagesToReorder, setStagesToReorder] = useState<Stage[]>([])
  const [savingStage, setSavingStage] = useState(false)
  const [deletingStage, setDeletingStage] = useState('')
  const [showStageForm, setShowStageForm] = useState(false)

  // 🎨 NUEVOS ESTADOS PARA ALERTAS BONITAS
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Colores predefinidos para etapas
  const stageColors = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarillo
    '#EF4444', // Rojo
    '#8B5CF6', // Púrpura
    '#06B6D4', // Cian
    '#84CC16', // Lima
    '#F97316', // Naranja
    '#EC4899', // Rosa
    '#6B7280', // Gris
  ]

  useEffect(() => {
    fetchPipelineData()
  }, [])

  const fetchPipelineData = async () => {
    try {
      const [stagesResponse, clientsResponse] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/clients')
      ])

      if (stagesResponse.ok && clientsResponse.ok) {
        const stagesData = await stagesResponse.json()
        const clientsData = await clientsResponse.json()

        setStages(stagesData.sort((a: Stage, b: Stage) => a.order - b.order))
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientsInStage = (stageId: string) => {
    return clients.filter(client => client.stageId === stageId)
  }

  // 🔧 DRAG & DROP FUNCTIONS ARREGLADAS
  const handleDragStart = (e: React.DragEvent, client: Client) => {
    console.log('🎯 Iniciando drag:', client.name)
    setDraggedClient(client)
    
    // Configurar efectos visuales correctamente
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify(client))
    
    // Aplicar efectos visuales al elemento arrastrado
    const target = e.currentTarget as HTMLElement
    target.classList.add('opacity-50', 'rotate-2')
    
    // NO crear imagen fantasma personalizada para evitar elementos flotantes
    // Usar la imagen por defecto del navegador
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Limpiar efectos visuales
    const target = e.currentTarget as HTMLElement
    target.classList.remove('opacity-50', 'rotate-2')
    
    // Limpiar TODAS las zonas de drop y elementos flotantes
    document.querySelectorAll('[data-drop-zone]').forEach(zone => {
      zone.classList.remove('bg-blue-100', 'border-blue-300', 'border-2')
    })
    
    // Limpiar cualquier elemento flotante que pueda haber quedado
    document.querySelectorAll('.opacity-50').forEach(el => {
      el.classList.remove('opacity-50', 'rotate-2')
    })
    
    // Forzar limpieza del estado
    setTimeout(() => {
      setDraggedClient(null)
    }, 100)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Resaltar zona de drop
    const target = e.currentTarget as HTMLElement
    target.classList.add('bg-blue-100', 'border-blue-300', 'border-2')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo remover si realmente salimos del elemento
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      target.classList.remove('bg-blue-100', 'border-blue-300', 'border-2')
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🎯 Drop en etapa:', targetStageId)
    
    // Limpiar efectos visuales
    const target = e.currentTarget as HTMLElement
    target.classList.remove('bg-blue-100', 'border-blue-300', 'border-2')
    
    // Obtener datos del cliente
    let clientData: Client
    try {
      const dragData = e.dataTransfer.getData('application/json')
      if (dragData) {
        clientData = JSON.parse(dragData)
      } else if (draggedClient) {
        clientData = draggedClient
      } else {
        console.error('No se pudo obtener datos del cliente')
        return
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
      if (!draggedClient) return
      clientData = draggedClient
    }

    // Verificar si ya está en la misma etapa
    if (clientData.stageId === targetStageId) {
      console.log('Cliente ya está en esta etapa')
      setDraggedClient(null)
      return
    }

    console.log('🚀 Moviendo cliente:', clientData.name, 'a etapa:', targetStageId)

    try {
      const response = await fetch('/api/clients/move-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientData.id,
          newStageId: targetStageId,
          notes: `Movido via pipeline de ${stages.find(s => s.id === clientData.stageId)?.name || 'Sin etapa'} a ${stages.find(s => s.id === targetStageId)?.name}`
        })
      })

      if (response.ok) {
        console.log('✅ Cliente movido exitosamente')
        // Actualizar estado local
        setClients(prev => prev.map(client => 
          client.id === clientData.id 
            ? { 
                ...client, 
                stageId: targetStageId, 
                stageEnteredAt: new Date().toISOString() 
              }
            : client
        ))
      } else {
        console.error('❌ Error del servidor:', response.status)
        try {
          const errorData = await response.json()
          setErrorMessage(errorData.error || 'No se pudo mover el cliente')
          setShowErrorModal(true)
        } catch (parseError) {
          setErrorMessage(`Error del servidor: ${response.status} - ${response.statusText}`)
          setShowErrorModal(true)
        }
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error)
      setErrorMessage('Error de conexión al mover cliente')
      setShowErrorModal(true)
    } finally {
      setDraggedClient(null)
    }
  }

  // Add existing clients functions
  const handleShowExistingClients = async (stageId: string) => {
    setSelectedStageId(stageId)
    
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const allClients = await response.json()
        const available = allClients.filter((client: Client) => client.stageId !== stageId)
        setAvailableClients(available)
        setShowExistingClientsModal(true)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleAddExistingClients = async () => {
    if (selectedClientIds.length === 0) return
    
    setAddingClients(true)
    try {
      const promises = selectedClientIds.map(clientId =>
        fetch('/api/clients/move-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            newStageId: selectedStageId,
            notes: 'Agregado al pipeline'
          })
        })
      )

      await Promise.all(promises)
      
      setClients(prev => prev.map(client => 
        selectedClientIds.includes(client.id)
          ? { ...client, stageId: selectedStageId, stageEnteredAt: new Date().toISOString() }
          : client
      ))

      setSelectedClientIds([])
      setSearchTerm('')
      setShowExistingClientsModal(false)
    } catch (error) {
      console.error('Error adding clients:', error)
      setErrorMessage('Error al agregar clientes al pipeline')
      setShowErrorModal(true)
    } finally {
      setAddingClients(false)
    }
  }

  const handleClientSelect = (clientId: string, checked: boolean) => {
    setSelectedClientIds(prev => 
      checked 
        ? [...prev, clientId]
        : prev.filter(id => id !== clientId)
    )
  }

  // Remove from pipeline functions
  const handleRemoveFromPipeline = (client: Client) => {
    setClientToRemove(client)
    setShowRemoveConfirmModal(true)
  }

  const confirmRemoveFromPipeline = async () => {
    if (!clientToRemove) return
    
    setRemoving(true)
    try {
      const response = await fetch('/api/clients/remove-from-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientToRemove.id })
      })

      if (response.ok) {
        setClients(prev => prev.map(client => 
          client.id === clientToRemove.id 
            ? { ...client, stageId: null, stageEnteredAt: null }
            : client
        ))
        setShowRemoveConfirmModal(false)
        setClientToRemove(null)
      } else {
        setErrorMessage('Error al remover el cliente del pipeline')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error removing client from pipeline:', error)
      setErrorMessage('Error al remover el cliente del pipeline')
      setShowErrorModal(true)
    } finally {
      setRemoving(false)
    }
  }

  // Stage configuration functions
  const handleShowStageConfig = () => {
    const stagesWithUpdatedCounts = stages.map(stage => ({
      ...stage,
      _count: {
        clients: clients.filter(client => client.stageId === stage.id).length
      }
    }))
    
    setStagesToReorder(stagesWithUpdatedCounts)
    setShowStageConfigModal(true)
  }

  const handleCreateStage = () => {
    setEditingStage(null)
    setStageForm({
      name: '',
      description: '',
      color: stageColors[stages.length % stageColors.length]
    })
    setShowStageForm(true)
  }

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage)
    setStageForm({
      name: stage.name,
      description: stage.description,
      color: stage.color
    })
    setShowStageForm(true)
  }

  // 🎨 FUNCIÓN ARREGLADA - Sin alert() feo
  const handleSaveStage = async () => {
    if (!stageForm.name.trim()) {
      setErrorMessage('El nombre de la etapa es requerido')
      setShowErrorModal(true)
      return
    }
    
    setSavingStage(true)
    try {
      const url = editingStage 
        ? `/api/stages/${editingStage.id}`
        : '/api/stages'
      
      const method = editingStage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm)
      })
      
      if (response.ok) {
        const savedStage = await response.json()
        
        if (editingStage) {
          setStagesToReorder(prev => prev.map(stage => 
            stage.id === editingStage.id ? { ...stage, ...savedStage } : stage
          ))
          setStages(prev => prev.map(stage => 
            stage.id === editingStage.id ? { ...stage, ...savedStage } : stage
          ))
        } else {
          setStagesToReorder(prev => [...prev, { ...savedStage, _count: { clients: 0 } }])
          setStages(prev => [...prev, { ...savedStage, _count: { clients: 0 } }])
        }
        
        setEditingStage(null)
        setStageForm({ name: '', description: '', color: '#6B7280' })
        setShowStageForm(false)
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Error al guardar etapa')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error saving stage:', error)
      setErrorMessage('Error al guardar etapa')
      setShowErrorModal(true)
    } finally {
      setSavingStage(false)
    }
  }

  // 🎨 FUNCIÓN ARREGLADA - Sin confirm() feo, con modal bonito
  const handleDeleteStage = (stage: Stage) => {
    setStageToDelete(stage)
    setShowDeleteConfirmModal(true)
  }

  // 🎨 NUEVA FUNCIÓN - Confirmar eliminación con modal bonito
  const confirmDeleteStage = async () => {
    if (!stageToDelete) return
    
    setDeletingStage(stageToDelete.id)
    try {
      const response = await fetch(`/api/stages/${stageToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setStagesToReorder(prev => prev.filter(stage => stage.id !== stageToDelete.id))
        setStages(prev => prev.filter(stage => stage.id !== stageToDelete.id))
        setShowDeleteConfirmModal(false)
        setStageToDelete(null)
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Error al eliminar etapa')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error deleting stage:', error)
      setErrorMessage('Error al eliminar etapa')
      setShowErrorModal(true)
    } finally {
      setDeletingStage('')
    }
  }

  const handleReorderStages = (dragIndex: number, hoverIndex: number) => {
    const draggedStage = stagesToReorder[dragIndex]
    const newStages = [...stagesToReorder]
    newStages.splice(dragIndex, 1)
    newStages.splice(hoverIndex, 0, draggedStage)
    setStagesToReorder(newStages)
  }

  const handleSaveStageOrder = async () => {
    try {
      const response = await fetch('/api/stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: stagesToReorder })
      })
      
      if (response.ok) {
        setStages(stagesToReorder)
        setShowStageConfigModal(false)
      } else {
        setErrorMessage('Error al guardar orden')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error saving order:', error)
      setErrorMessage('Error al guardar orden')
      setShowErrorModal(true)
    }
  }

  // Utility functions
  const filteredAvailableClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  )

  const formatLastVisit = (lastVisit: string | null) => {
    if (!lastVisit) return "Sin visitas"

    const date = new Date(lastVisit)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    return `Hace ${Math.floor(diffDays / 30)} meses`
  }

  const getTags = (tagsString: string): string[] => {
    try {
      return JSON.parse(tagsString || '[]')
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pipeline de Clientes</h1>
            <p className="text-gray-500">
              Arrastra y suelta clientes entre etapas para actualizar su estado
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShowStageConfig}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Etapas
          </Button>
          <Button onClick={() => router.push('/dashboard/clients')}>
            <Users className="h-4 w-4 mr-2" />
            Ver Lista
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-gray-600">Total Clientes</p>
              </div>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {stages.slice(0, 3).map((stage) => {
          const stageClients = getClientsInStage(stage.id)
          const totalValue = stageClients.reduce((sum, client) => sum + client.totalSpent, 0)

          return (
            <Card key={stage.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stageClients.length}</p>
                    <p className="text-xs text-gray-600">{stage.name}</p>
                    <p className="text-xs text-gray-500">
                      ₡{totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageClients = getClientsInStage(stage.id)

          return (
            <div
              key={stage.id}
              className="min-w-80 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200 transition-all duration-200"
              data-drop-zone="true"
              data-stage-id={stage.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-lg">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stageClients.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEditStage(stage)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4">{stage.description}</p>

              {/* 🔧 ZONA DE DROP ARREGLADA */}
              <div 
                className="space-y-3 max-h-96 overflow-y-auto min-h-32 p-2 rounded-lg transition-all duration-200"
                data-drop-zone="true"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {stageClients.map((client) => {
                  const tags = getTags(client.tags)
                  const isVIP = tags.includes('VIP') || tags.includes('Oro') || tags.includes('Premium')

                  return (
                    <Card
                      key={client.id}
                      className={`cursor-move hover:shadow-lg transition-all duration-200 relative group ${
                        isVIP ? 'ring-2 ring-purple-200' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client)}
                      onDragEnd={handleDragEnd}
                    >
                      <CardContent className="p-4">
                        {/* Dropdown Menu */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Ver/Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRemoveFromPipeline(client)}
                                className="text-orange-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remover del Pipeline
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-start justify-between mb-2 pr-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{client.name}</h4>
                              {isVIP && <span className="text-purple-500">⭐</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {client.email && (
                                <Mail className="h-3 w-3 text-gray-400" />
                              )}
                              {client.phone && (
                                <Phone className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-50">
                            <Grip className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Client Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <div className="font-semibold">
                              ₡{client.totalSpent.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Visitas:</span>
                            <div className="font-semibold">{client.visitCount}</div>
                          </div>
                        </div>

                        {/* Last Visit */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          {formatLastVisit(client.lastVisit)}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 2).map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className={`text-xs ${
                                  tag.toLowerCase().includes('vip') || 
                                  tag.toLowerCase().includes('oro') ||
                                  tag.toLowerCase().includes('premium')
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : ''
                                }`}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Stage Entry Time */}
                        {client.stageEnteredAt && (
                          <div className="mt-2 pt-2 border-t text-xs text-gray-400">
                            En esta etapa desde: {new Date(client.stageEnteredAt).toLocaleDateString('es-CR')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {/* 🔧 EMPTY STATE ARREGLADO */}
                {stageClients.length === 0 && (
                  <div 
                    className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg bg-white/50 transition-all duration-200 hover:border-gray-400"
                    data-drop-zone="true"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay clientes en esta etapa</p>
                    <p className="text-xs">Arrastra clientes aquí</p>
                  </div>
                )}
              </div>

              {/* Add Client Button */}
              <Button 
                variant="ghost" 
                className="w-full mt-4 border-2 border-dashed border-gray-300 hover:border-gray-400"
                onClick={() => handleShowExistingClients(stage.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente Existente
              </Button>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleShowExistingClients(stages[0]?.id || '')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Clientes Existentes
            </Button>
            <Button variant="outline" className="justify-start" onClick={handleShowStageConfig}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Etapas
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Métricas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🎨 MODAL DE CONFIRMACIÓN PARA ELIMINAR ETAPA - BONITO */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Eliminar Etapa
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                ¿Estás seguro de que quieres eliminar la etapa <strong>"{stageToDelete?.name}"</strong>?
              </p>
              
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Esta acción no se puede deshacer</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  La etapa será eliminada permanentemente del sistema.
                </p>
              </div>

              {stageToDelete && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stageToDelete.color }}
                  />
                  <span className="text-gray-600">
                    {stageToDelete.description || 'Sin descripción'}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirmModal(false)
                setStageToDelete(null)
              }}
              disabled={deletingStage !== ''}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteStage}
              disabled={deletingStage !== ''}
            >
              {deletingStage !== '' ? (
                <>
                  <X className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Etapa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🎨 MODAL DE ERROR - BONITO */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </DialogTitle>
            <DialogDescription>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  {errorMessage}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowErrorModal(false)
                setErrorMessage('')
              }}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de modales existentes... */}
      {/* Modal - Agregar Clientes Existentes */}
      <Dialog open={showExistingClientsModal} onOpenChange={setShowExistingClientsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar Clientes Existentes</DialogTitle>
            <DialogDescription>
              Selecciona clientes para agregar a {stages.find(s => s.id === selectedStageId)?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Counter */}
            {selectedClientIds.length > 0 && (
              <div className="text-sm text-blue-600">
                {selectedClientIds.length} cliente(s) seleccionado(s)
              </div>
            )}

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredAvailableClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay clientes disponibles</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredAvailableClients.map((client) => {
                    const tags = getTags(client.tags)
                    const isVIP = tags.includes('VIP') || tags.includes('Oro') || tags.includes('Premium')
                    const currentStage = stages.find(s => s.id === client.stageId)
                    
                    return (
                      <div
                        key={client.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                          selectedClientIds.includes(client.id) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={(checked) => 
                            handleClientSelect(client.id, checked as boolean)
                          }
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{client.name}</h4>
                              {isVIP && <span className="text-purple-500">⭐</span>}
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-semibold">₡{client.totalSpent.toLocaleString()}</div>
                              <div className="text-gray-500">{client.visitCount} visitas</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-gray-600">
                              {client.email || client.phone || 'Sin contacto'}
                            </div>
                            {currentStage && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: currentStage.color }}
                                />
                                <span className="text-xs text-gray-500">{currentStage.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowExistingClientsModal(false)
                setSelectedClientIds([])
                setSearchTerm('')
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddExistingClients}
              disabled={selectedClientIds.length === 0 || addingClients}
            >
              {addingClients ? 'Agregando...' : `Agregar ${selectedClientIds.length} Cliente(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Confirmar Remover del Pipeline */}
      <Dialog open={showRemoveConfirmModal} onOpenChange={setShowRemoveConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Remover del Pipeline
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres remover a <strong>{clientToRemove?.name}</strong> del pipeline?
              <br />
              <br />
              El cliente será removido de <strong>{stages.find(s => s.id === clientToRemove?.stageId)?.name}</strong> pero:
              <ul className="list-disc list-inside mt-2 text-sm text-green-700">
                <li>✅ Sus datos se mantendrán intactos</li>
                <li>✅ Seguirá visible en la sección de Clientes</li>
                <li>✅ Su historial se preservará</li>
                <li>✅ Podrás agregarlo de nuevo cuando quieras</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRemoveConfirmModal(false)
                setClientToRemove(null)
              }}
              disabled={removing}
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={confirmRemoveFromPipeline}
              disabled={removing}
            >
              {removing ? (
                <>
                  <X className="h-4 w-4 mr-2 animate-spin" />
                  Removiendo...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Remover del Pipeline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Configuración de Etapas */}
      <Dialog open={showStageConfigModal} onOpenChange={setShowStageConfigModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Etapas del Pipeline
            </DialogTitle>
            <DialogDescription>
              Personaliza las etapas de tu proceso de ventas. Arrastra para reordenar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh]">
            {/* COLUMNA 1: Lista de Etapas Actuales */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Etapas Actuales ({stagesToReorder.length})</h3>
              </div>
              
              <div className="overflow-y-auto max-h-96 space-y-3 pr-2">
                {stagesToReorder.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay etapas configuradas</p>
                    <p className="text-sm">Crea tu primera etapa</p>
                  </div>
                ) : (
                  stagesToReorder.map((stage, index) => {
                    const realClientCount = clients.filter(client => client.stageId === stage.id).length
                    
                    return (
                      <div
                        key={stage.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-all duration-200 group"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
                          handleReorderStages(dragIndex, index)
                        }}
                      >
                        {/* Drag Handle */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Grip className="h-5 w-5 text-gray-400 cursor-move" />
                        </div>
                        
                        {/* Color Indicator */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-gray-200"
                          style={{ backgroundColor: stage.color }}
                        />
                        
                        {/* Stage Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{stage.name}</h4>
                            <div className="flex gap-1">
                              {stage.isDefault && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  Por defecto
                                </Badge>
                              )}
                              <Badge 
                                variant={realClientCount > 0 ? "default" : "secondary"} 
                                className="text-xs px-1 py-0"
                              >
                                {realClientCount} cliente{realClientCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          
                          {stage.description && (
                            <p className="text-xs text-gray-600 truncate">{stage.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Orden: {index + 1}</span>
                            {realClientCount > 0 && (
                              <span className="text-xs text-green-600">• Activa</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStage(stage)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {!stage.isDefault && realClientCount === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStage(stage)}
                              disabled={deletingStage === stage.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingStage === stage.id ? (
                                <X className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          
                          {!stage.isDefault && realClientCount > 0 && (
                            <div className="text-xs text-orange-600 px-2 py-1 bg-orange-50 rounded">
                              Tiene clientes
                            </div>
                          )}
                          
                          {stage.isDefault && (
                            <div className="text-xs text-blue-600 px-2 py-1 bg-blue-50 rounded">
                              No eliminable
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            {/* COLUMNA 2: Formulario de Etapa */}
            <div className="space-y-4">
              {showStageForm ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    {editingStage ? (
                      <>
                        <Edit className="h-4 w-4" />
                        Editar Etapa
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Nueva Etapa
                      </>
                    )}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre de la Etapa *
                      </label>
                      <Input
                        value={stageForm.name}
                        onChange={(e) => setStageForm({...stageForm, name: e.target.value})}
                        placeholder="Ej: Prospecto, Contactado..."
                        maxLength={50}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {stageForm.name.length}/50 caracteres
                      </p>
                    </div>
                    
                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Color de la Etapa
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {stageColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                              stageForm.color === color 
                                ? 'border-gray-800 ring-2 ring-gray-300' 
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setStageForm({...stageForm, color})}
                            title={`Color ${color}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: stageForm.color }}
                        />
                        <span className="text-xs text-gray-600">Vista previa</span>
                      </div>
                    </div>
                    
                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={stageForm.description}
                        onChange={(e) => setStageForm({...stageForm, description: e.target.value})}
                        placeholder="Describe qué representa esta etapa..."
                        maxLength={200}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {stageForm.description.length}/200 caracteres
                      </p>
                    </div>
                    
                    {/* Botones */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveStage}
                        disabled={!stageForm.name.trim() || savingStage}
                        size="sm"
                        className="flex-1"
                      >
                        {savingStage ? (
                          <>
                            <X className="h-3 w-3 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : editingStage ? (
                          'Actualizar'
                        ) : (
                          'Crear Etapa'
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingStage(null)
                          setStageForm({ name: '', description: '', color: '#6B7280' })
                          setShowStageForm(false)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="font-semibold text-lg mb-2">Gestiona tus Etapas</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Las etapas representan los pasos de tu proceso de ventas. 
                    Puedes crear, editar y reordenar según tu flujo de trabajo.
                  </p>
                  
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Arrastra para reordenar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Haz clic en editar para modificar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Solo se eliminan etapas vacías</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateStage}
                    className="mt-4 w-full"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Etapa
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4">
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-500">
                {stagesToReorder.length} etapa{stagesToReorder.length !== 1 ? 's' : ''} configurada{stagesToReorder.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowStageConfigModal(false)
                    setShowStageForm(false)
                    setEditingStage(null)
                  }}
                >
                  Cerrar
                </Button>
                <Button 
                  onClick={handleSaveStageOrder}
                  disabled={stagesToReorder.length === 0}
                >
                  Guardar Orden
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}