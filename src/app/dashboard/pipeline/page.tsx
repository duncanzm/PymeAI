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
  Clock,
  UserPlus,
  Search,
  Trash2,
  MoreVertical,
  Edit,
  X,
  Filter
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
  
  // Búsqueda global y filtros
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'vip' | 'high-value' | 'recent'>('all')
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed')
  
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

  // Alertas bonitas
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Colores predefinidos para etapas
  const stageColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
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

  const getTags = (tagsString: string): string[] => {
    try {
      return JSON.parse(tagsString || '[]')
    } catch {
      return []
    }
  }

  const getFilteredClientsInStage = (stageId: string) => {
    let stageClients = clients.filter(client => client.stageId === stageId)
    
    if (globalSearchTerm) {
      stageClients = stageClients.filter(client => 
        client.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        client.phone?.includes(globalSearchTerm)
      )
    }
    
    switch (selectedFilter) {
      case 'vip':
        stageClients = stageClients.filter(client => {
          const tags = getTags(client.tags)
          return tags.some(tag => 
            tag.toLowerCase().includes('vip') || 
            tag.toLowerCase().includes('oro') ||
            tag.toLowerCase().includes('premium')
          )
        })
        break
      case 'high-value':
        stageClients = stageClients.filter(client => client.totalSpent > 150000)
        break
      case 'recent':
        stageClients = stageClients.filter(client => {
          if (!client.lastVisit) return false
          const daysSince = Math.floor(
            (Date.now() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSince <= 30
        })
        break
    }
    
    return stageClients
  }

  const calculateBasicMetrics = () => {
    const pipelineClients = clients.filter(c => c.stageId)
    return {
      totalValue: pipelineClients.reduce((sum, c) => sum + c.totalSpent, 0),
      totalClients: pipelineClients.length,
      avgValuePerClient: pipelineClients.length > 0 
        ? pipelineClients.reduce((sum, c) => sum + c.totalSpent, 0) / pipelineClients.length
        : 0
    }
  }

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

  // Drag & Drop Functions
  const handleDragStart = (e: React.DragEvent, client: Client) => {
    setDraggedClient(client)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', client.id)
    const target = e.currentTarget as HTMLElement
    setTimeout(() => {
      target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
    setDraggedClient(null)
    document.querySelectorAll('[data-drop-zone]').forEach(zone => {
      zone.classList.remove('bg-blue-50', 'border-blue-400')
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const target = e.currentTarget as HTMLElement
    if (!target.classList.contains('bg-blue-50')) {
      target.classList.add('bg-blue-50', 'border-blue-400')
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.add('bg-blue-50', 'border-blue-400')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!target.contains(relatedTarget)) {
      target.classList.remove('bg-blue-50', 'border-blue-400')
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.currentTarget as HTMLElement
    target.classList.remove('bg-blue-50', 'border-blue-400')
    
    const clientId = e.dataTransfer.getData('text/plain')
    const clientData = draggedClient || clients.find(c => c.id === clientId)
    
    if (!clientData) return

    if (clientData.stageId === targetStageId) {
      setDraggedClient(null)
      return
    }

    // Optimistic update
    setClients(prev => prev.map(client => 
      client.id === clientData.id 
        ? { ...client, stageId: targetStageId, stageEnteredAt: new Date().toISOString() }
        : client
    ))

    try {
      const response = await fetch('/api/clients/move-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientData.id,
          newStageId: targetStageId,
          notes: `Movido via pipeline`
        })
      })

      if (!response.ok) {
        // Revert on error
        setClients(prev => prev.map(client => 
          client.id === clientData.id ? clientData : client
        ))
        setErrorMessage('Error al mover cliente')
        setShowErrorModal(true)
      }
    } catch (error) {
      // Revert on error
      setClients(prev => prev.map(client => 
        client.id === clientData.id ? clientData : client
      ))
      setErrorMessage('Error de conexión')
      setShowErrorModal(true)
    } finally {
      setDraggedClient(null)
    }
  }

  // Other handlers
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
      setErrorMessage('Error al agregar clientes')
      setShowErrorModal(true)
    } finally {
      setAddingClients(false)
    }
  }

  const handleClientSelect = (clientId: string, checked: boolean) => {
    setSelectedClientIds(prev => 
      checked ? [...prev, clientId] : prev.filter(id => id !== clientId)
    )
  }

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
        setErrorMessage('Error al remover cliente')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error removing client:', error)
      setErrorMessage('Error al remover cliente')
      setShowErrorModal(true)
    } finally {
      setRemoving(false)
    }
  }

  const handleShowStageConfig = () => {
    setStagesToReorder(stages.map(stage => ({
      ...stage,
      _count: { clients: clients.filter(client => client.stageId === stage.id).length }
    })))
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

  const handleSaveStage = async () => {
    if (!stageForm.name.trim()) {
      setErrorMessage('El nombre es requerido')
      setShowErrorModal(true)
      return
    }
    
    setSavingStage(true)
    try {
      const url = editingStage ? `/api/stages/${editingStage.id}` : '/api/stages'
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
          const newStage = { ...savedStage, _count: { clients: 0 } }
          setStagesToReorder(prev => [...prev, newStage])
          setStages(prev => [...prev, newStage])
        }
        
        setEditingStage(null)
        setStageForm({ name: '', description: '', color: '#6B7280' })
        setShowStageForm(false)
      } else {
        setErrorMessage('Error al guardar etapa')
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

  const handleDeleteStage = (stage: Stage) => {
    setStageToDelete(stage)
    setShowDeleteConfirmModal(true)
  }

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
        setErrorMessage('Error al eliminar etapa')
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

  const filteredAvailableClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const metrics = calculateBasicMetrics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Pipeline de Clientes</h1>
              <p className="text-gray-500">Arrastra y suelta clientes entre etapas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
            >
              {viewMode === 'compact' ? 'Vista Detallada' : 'Vista Compacta'}
            </Button>
            <Button variant="outline" onClick={handleShowStageConfig}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
            <Button onClick={() => router.push('/dashboard/clients')}>
              <Users className="h-4 w-4 mr-2" />
              Ver Lista
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {selectedFilter === 'all' ? 'Todos' :
                 selectedFilter === 'vip' ? 'VIP' :
                 selectedFilter === 'high-value' ? 'Alto Valor' : 'Recientes'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                Todos los clientes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedFilter('vip')}>
                Solo clientes VIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedFilter('high-value')}>
                Alto valor (&gt;₡150k)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedFilter('recent')}>
                Activos últimos 30 días
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{metrics.totalClients}</p>
                  <p className="text-xs text-gray-600">En Pipeline</p>
                </div>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₡{Math.round(metrics.totalValue / 1000)}k</p>
                  <p className="text-xs text-gray-600">Valor Total</p>
                </div>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₡{Math.round(metrics.avgValuePerClient / 1000)}k</p>
                  <p className="text-xs text-gray-600">Promedio</p>
                </div>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stages.length}</p>
                  <p className="text-xs text-gray-600">Etapas</p>
                </div>
                <Settings className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageClients = getFilteredClientsInStage(stage.id)
          const totalValue = stageClients.reduce((sum, client) => sum + client.totalSpent, 0)

          return (
            <div key={stage.id} className="min-w-80 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-semibold text-lg">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">{stageClients.length}</Badge>
                </div>
                <div className="text-xs text-gray-500">₡{Math.round(totalValue / 1000)}k</div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{stage.description}</p>

              <div 
                className="space-y-3 max-h-96 overflow-y-auto min-h-32 p-2 rounded-lg border-2 border-dashed border-gray-200"
                data-drop-zone="true"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {stageClients.map((client) => {
                  const tags = getTags(client.tags)
                  const isVIP = tags.some(tag => 
                    tag.toLowerCase().includes('vip') || 
                    tag.toLowerCase().includes('oro') ||
                    tag.toLowerCase().includes('premium')
                  )

                  return (
                    <div
                      key={client.id}
                      className={`bg-white p-3 rounded-lg border cursor-move hover:shadow-lg transition-all ${
                        isVIP ? 'ring-2 ring-purple-200' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, client)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{client.name}</h4>
                            {isVIP && <span className="text-purple-500">⭐</span>}
                          </div>
                          {viewMode === 'detailed' && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              {client.email && <Mail className="h-3 w-3" />}
                              {client.phone && <Phone className="h-3 w-3" />}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Ver/Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveFromPipeline(client)}
                              className="text-orange-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <div className="font-semibold">₡{client.totalSpent.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Visitas:</span>
                          <div className="font-semibold">{client.visitCount}</div>
                        </div>
                      </div>

                      {viewMode === 'detailed' && (
                        <>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Clock className="h-3 w-3" />
                            {formatLastVisit(client.lastVisit)}
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{tags.length - 2}</Badge>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}

                {stageClients.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay clientes</p>
                    <p className="text-xs">Arrastra aquí</p>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                className="w-full mt-4 border-2 border-dashed border-gray-300 hover:border-gray-400"
                onClick={() => handleShowExistingClients(stage.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </DialogTitle>
            <DialogDescription>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Eliminar Etapa
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la etapa <strong>{stageToDelete?.name}</strong>?
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteStage} disabled={deletingStage !== ''}>
              {deletingStage !== '' ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveConfirmModal} onOpenChange={setShowRemoveConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Remover del Pipeline
            </DialogTitle>
            <DialogDescription>
              ¿Remover a <strong>{clientToRemove?.name}</strong> del pipeline?
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Los datos se mantienen</li>
                  <li>✅ Seguirá visible en Clientes</li>
                  <li>✅ Podrás agregarlo de nuevo</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveConfirmModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="outline" 
              className="text-orange-600 border-orange-200"
              onClick={confirmRemoveFromPipeline}
              disabled={removing}
            >
              {removing ? 'Removiendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExistingClientsModal} onOpenChange={setShowExistingClientsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar Clientes</DialogTitle>
            <DialogDescription>
              Selecciona clientes para {stages.find(s => s.id === selectedStageId)?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedClientIds.length > 0 && (
              <div className="text-sm text-blue-600">
                {selectedClientIds.length} seleccionado(s)
              </div>
            )}

            <div className="flex-1 overflow-y-auto border rounded-lg p-4">
              {filteredAvailableClients.map((client) => (
                <div
                  key={client.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border mb-2 ${
                    selectedClientIds.includes(client.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedClientIds.includes(client.id)}
                    onCheckedChange={(checked) => handleClientSelect(client.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{client.name}</h4>
                    <p className="text-sm text-gray-600">
                      {client.email || client.phone || 'Sin contacto'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₡{client.totalSpent.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{client.visitCount} visitas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExistingClientsModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddExistingClients}
              disabled={selectedClientIds.length === 0 || addingClients}
            >
              {addingClients ? 'Agregando...' : `Agregar ${selectedClientIds.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStageConfigModal} onOpenChange={setShowStageConfigModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configurar Etapas</DialogTitle>
            <DialogDescription>Personaliza las etapas del pipeline</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Etapas Actuales</h3>
              {stagesToReorder.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
                    handleReorderStages(dragIndex, index)
                  }}
                >
                  <Grip className="h-4 w-4 text-gray-400 cursor-move" />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1">
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-xs text-gray-500">{stage.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditStage(stage)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!stage.isDefault && stage._count.clients === 0 && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteStage(stage)}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              {showStageForm ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">
                    {editingStage ? 'Editar Etapa' : 'Nueva Etapa'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre</label>
                      <Input
                        value={stageForm.name}
                        onChange={(e) => setStageForm({...stageForm, name: e.target.value})}
                        placeholder="Nombre de la etapa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descripción</label>
                      <textarea
                        value={stageForm.description}
                        onChange={(e) => setStageForm({...stageForm, description: e.target.value})}
                        placeholder="Descripción opcional"
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <div className="grid grid-cols-5 gap-2">
                        {stageColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              stageForm.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setStageForm({...stageForm, color})}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveStage} disabled={savingStage}>
                        {savingStage ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowStageForm(false)
                          setEditingStage(null)
                          setStageForm({ name: '', description: '', color: '#6B7280' })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-6 text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Gestiona las etapas del pipeline</p>
                  <Button onClick={handleCreateStage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Etapa
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageConfigModal(false)}>
              Cerrar
            </Button>
            <Button onClick={handleSaveStageOrder}>Guardar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}