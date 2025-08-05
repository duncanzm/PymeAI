// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener tareas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const stageId = searchParams.get('stageId')
    const completed = searchParams.get('completed')
    const type = searchParams.get('type') // 'client' | 'template'
    
    let whereClause: any = {
      userId: "temp-user-id"
    }
    
    // Filtros
    if (clientId) {
      whereClause.clientId = clientId
    }
    
    if (stageId) {
      whereClause.stageId = stageId
    }
    
    if (completed !== null) {
      whereClause.completed = completed === 'true'
    }
    
    if (type === 'template') {
      whereClause.clientId = null // Solo tareas template
    } else if (type === 'client') {
      whereClause.clientId = { not: null } // Solo tareas de clientes
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, stage: true }
        },
        stage: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: [
        { completed: 'asc' }, // No completadas primero
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      clientId, 
      stageId, 
      dueDate, 
      priority = 'medium',
      type = 'manual'
    } = body
    
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'El título de la tarea es requerido' },
        { status: 400 }
      )
    }
    
    // Validar que existe el cliente si se proporciona
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId, userId: "temp-user-id" }
      })
      
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }
    }
    
    // Validar que existe la etapa si se proporciona
    if (stageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: stageId, userId: "temp-user-id" }
      })
      
      if (!stage) {
        return NextResponse.json(
          { error: 'Etapa no encontrada' },
          { status: 404 }
        )
      }
    }
    
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        clientId: clientId || null,
        stageId: stageId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        type,
        userId: "temp-user-id"
      },
      include: {
        client: {
          select: { id: true, name: true }
        },
        stage: {
          select: { id: true, name: true, color: true }
        }
      }
    })
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}

// PUT - Marcar tarea como completada/no completada en lote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskIds, completed, notes } = body
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs de tareas' },
        { status: 400 }
      )
    }
    
    const updateData: any = {
      completed: completed === true,
      updatedAt: new Date()
    }
    
    if (completed === true) {
      updateData.completedAt = new Date()
      if (notes) {
        updateData.notes = notes
      }
    } else {
      updateData.completedAt = null
    }
    
    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        userId: "temp-user-id"
      },
      data: updateData
    })
    
    return NextResponse.json({ 
      success: true,
      updatedCount: taskIds.length 
    })
  } catch (error) {
    console.error('Error updating tasks:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tareas' },
      { status: 500 }
    )
  }
}