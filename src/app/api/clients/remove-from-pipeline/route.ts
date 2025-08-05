// src/app/api/clients/remove-from-pipeline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Remover cliente del pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId } = body

    console.log('🎯 API remove-from-pipeline recibida:', { clientId })

    if (!clientId) {
      return NextResponse.json(
        { error: 'Se requiere clientId' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { 
        id: clientId,
        userId: "temp-user-id"
      },
      include: {
        stage: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Cliente encontrado:', client.name, 'Etapa actual:', client.stage?.name)

    // Remover del pipeline (poner stageId en null)
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        stageId: null,
        stageEnteredAt: null
      }
    })

    // Registrar la acción en interactions
    await prisma.interaction.create({
      data: {
        clientId,
        userId: "temp-user-id",
        type: 'stage_change',
        notes: `Removido del pipeline. Estaba en etapa: ${client.stage?.name || 'Sin etapa'}`
      }
    })

    console.log('✅ Cliente removido del pipeline exitosamente')

    return NextResponse.json({
      success: true,
      message: `${client.name} ha sido removido del pipeline`,
      client: updatedClient
    })
  } catch (error) {
    console.error('❌ Error removiendo cliente del pipeline:', error)
    return NextResponse.json(
      { error: 'Error al remover cliente del pipeline' },
      { status: 500 }
    )
  }
}