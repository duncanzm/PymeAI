// src/app/api/stages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar una etapa específica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, color } = body

    console.log('🔄 PUT /api/stages/[id] - Actualizando etapa:', id, { name, description, color })

    // Validaciones
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la etapa es requerido' },
        { status: 400 }
      )
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: 'El nombre no puede tener más de 50 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que la etapa existe
    const existingStage = await prisma.stage.findUnique({
      where: { 
        id,
        userId: "temp-user-id"
      }
    })

    if (!existingStage) {
      return NextResponse.json(
        { error: 'Etapa no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si ya existe otra etapa con ese nombre
    const duplicateStage = await prisma.stage.findFirst({
      where: {
        userId: "temp-user-id",
        name: name.trim(), // ✅ Búsqueda directa sin objeto
        NOT: { id }
      }
    })

    if (duplicateStage) {
      return NextResponse.json(
        { error: 'Ya existe otra etapa con ese nombre' },
        { status: 400 }
      )
    }

    // Actualizar la etapa
    const updatedStage = await prisma.stage.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        color: color || existingStage.color
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    console.log('✅ Etapa actualizada:', updatedStage)

    return NextResponse.json(updatedStage)
  } catch (error) {
    console.error('❌ Error actualizando etapa:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la etapa' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una etapa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log('🗑️ DELETE /api/stages/[id] - Eliminando etapa:', id)

    // Verificar que la etapa existe
    const existingStage = await prisma.stage.findUnique({
      where: { 
        id,
        userId: "temp-user-id"
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    if (!existingStage) {
      return NextResponse.json(
        { error: 'Etapa no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar etapas por defecto
    if (existingStage.isDefault) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar la etapa "${existingStage.name}" porque es una etapa por defecto del sistema.` 
        },
        { status: 400 }
      )
    }

    // No permitir eliminar etapas con clientes
    if (existingStage._count.clients > 0) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar la etapa "${existingStage.name}" porque tiene ${existingStage._count.clients} cliente(s) asignado(s). Mueve los clientes a otra etapa primero.` 
        },
        { status: 400 }
      )
    }

    // Eliminar la etapa
    await prisma.stage.delete({
      where: { id }
    })

    console.log('✅ Etapa eliminada exitosamente')

    return NextResponse.json({ 
      success: true,
      message: `Etapa "${existingStage.name}" eliminada exitosamente`
    })
  } catch (error) {
    console.error('❌ Error eliminando etapa:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la etapa' },
      { status: 500 }
    )
  }
}