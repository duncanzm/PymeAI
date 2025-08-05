// src/app/api/stages/route.ts - VERSIÓN COMPLETA
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todas las etapas
export async function GET() {
  try {
    console.log('🎯 GET /api/stages - Obteniendo etapas...')
    
    const stages = await prisma.stage.findMany({
      where: { userId: "temp-user-id" },
      include: {
        _count: {
          select: { clients: true }
        },
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            totalSpent: true,
            lastVisit: true,
            stageEnteredAt: true,
            tags: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    console.log('✅ Etapas obtenidas:', stages.length)
    return NextResponse.json(stages)
  } catch (error) {
    console.error('❌ Error obteniendo etapas:', error)
    return NextResponse.json(
      { error: 'Error al obtener etapas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva etapa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    console.log('🎯 POST /api/stages - Creando etapa:', { name, description, color })

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

    // Verificar si ya existe una etapa con ese nombre
    // ✅ CAMBIAR POR ESTO:
    const existingStage = await prisma.stage.findFirst({
      where: {
        userId: "temp-user-id",
        name: name.trim() // ✅ Búsqueda exacta
      }
    })

    if (existingStage) {
      return NextResponse.json(
        { error: 'Ya existe una etapa con ese nombre' },
        { status: 400 }
      )
    }

    // Obtener el siguiente número de orden
    const lastStage = await prisma.stage.findFirst({
      where: { userId: "temp-user-id" },
      orderBy: { order: 'desc' }
    })

    const nextOrder = (lastStage?.order || 0) + 1

    // Crear la nueva etapa
    const newStage = await prisma.stage.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#6B7280',
        order: nextOrder,
        isDefault: false, // Las nuevas etapas no son por defecto
        userId: "temp-user-id"
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    console.log('✅ Nueva etapa creada:', newStage)

    return NextResponse.json(newStage, { status: 201 })
  } catch (error) {
    console.error('❌ Error creando etapa:', error)
    return NextResponse.json(
      { error: 'Error al crear la etapa' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar orden de etapas (para reordenamiento)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { stages: stagesToUpdate } = body

    console.log('🔄 PUT /api/stages - Reordenando etapas:', stagesToUpdate.length)

    if (!stagesToUpdate || !Array.isArray(stagesToUpdate)) {
      return NextResponse.json(
        { error: 'Se requiere array de etapas' },
        { status: 400 }
      )
    }

    // Actualizar el orden de cada etapa
    const updatePromises = stagesToUpdate.map((stage, index) =>
      prisma.stage.update({
        where: { 
          id: stage.id,
          userId: "temp-user-id"
        },
        data: { order: index }
      })
    )

    await Promise.all(updatePromises)

    console.log('✅ Orden de etapas actualizado')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error reordenando etapas:', error)
    return NextResponse.json(
      { error: 'Error al reordenar etapas' },
      { status: 500 }
    )
  }
}