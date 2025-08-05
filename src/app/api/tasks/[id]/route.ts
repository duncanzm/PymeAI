// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener tarea específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const task = await prisma.task.findUnique({
      where: { id, userId: "temp-user-id" },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true }
        },
        stage: {
          select: { id: true, name: true, color: true }
        }
      }
    })
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tarea
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      title, 
      description, 
      completed, 
      dueDate, 
      priority,
      notes 
    } = body
    
    if (title && !title.trim()) {
      return NextResponse.json(
        { error: 'El título no puede estar vacío' },
        { status: 400 }
      )
    }
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    
    // Manejar estado de completado
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }
    
    const task = await prisma.task.update({
      where: { id, userId: "temp-user-id" },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true }
        },
        stage: {
          select: { id: true, name: true, color: true }
        }
      }
    })
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id, userId: "temp-user-id" }
    })
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }
    
    await prisma.task.delete({
      where: { id, userId: "temp-user-id" }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    )
  }
}