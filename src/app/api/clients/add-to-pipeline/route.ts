// src/app/api/clients/add-to-pipeline/route.ts - VERSIÓN TEMPORAL
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { clientIds, stageId } = await request.json()
    
    // Validaciones
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un cliente' },
        { status: 400 }
      )
    }

    if (!stageId) {
      return NextResponse.json(
        { error: 'Se requiere una etapa de destino' },
        { status: 400 }
      )
    }

    // Verificar que la etapa existe
    const stage = await prisma.stage.findUnique({
      where: { id: stageId }
    })

    if (!stage) {
      return NextResponse.json(
        { error: 'Etapa no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que todos los clientes existen y no están ya en el pipeline
    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
        userId: "temp-user-id" // TODO: Obtener del usuario autenticado
      }
    })

    if (clients.length !== clientIds.length) {
      return NextResponse.json(
        { error: 'Algunos clientes no fueron encontrados' },
        { status: 400 }
      )
    }

    // Filtrar clientes que ya están en el pipeline
    const clientsNotInPipeline = clients.filter(client => !client.stageId)
    const clientsAlreadyInPipeline = clients.filter(client => client.stageId)

    if (clientsNotInPipeline.length === 0) {
      return NextResponse.json(
        { 
          error: 'Todos los clientes seleccionados ya están en el pipeline',
          alreadyInPipeline: clientsAlreadyInPipeline.length
        },
        { status: 400 }
      )
    }

    // Agregar clientes al pipeline - SIN enteredStageAt por ahora
    const updatePromises = clientsNotInPipeline.map(client =>
      prisma.client.update({
        where: { id: client.id },
        data: {
          stageId: stageId
          // enteredStageAt: new Date() // Comentado hasta agregar el campo al schema
        }
      })
    )

    const updatedClients = await Promise.all(updatePromises)

    // Crear interacciones para trackear el movimiento
    const interactionPromises = updatedClients.map(client =>
      prisma.interaction.create({
        data: {
          clientId: client.id,
          userId: client.userId,
          type: 'pipeline_action',
          notes: `Cliente agregado a la etapa "${stage.name}" el ${new Date().toLocaleDateString('es-CR')}`,
          amount: null
        }
      })
    )

    await Promise.all(interactionPromises)

    return NextResponse.json({
      success: true,
      message: `${updatedClients.length} cliente(s) agregado(s) al pipeline`,
      addedCount: updatedClients.length,
      skippedCount: clientsAlreadyInPipeline.length,
      addedClients: updatedClients,
      skippedClients: clientsAlreadyInPipeline.map(c => ({
        id: c.id,
        name: c.name,
        currentStageId: c.stageId
      }))
    })

  } catch (error) {
    console.error('Error adding clients to pipeline:', error)
    return NextResponse.json(
      { error: 'Error al agregar clientes al pipeline' },
      { status: 500 }
    )
  }
}