// src/app/api/clients/move-stage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Mover cliente a nueva etapa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, newStageId, notes } = body
    
    console.log('🎯 API move-stage recibida:', { clientId, newStageId, notes })
    
    if (!clientId || !newStageId) {
      console.log('❌ Faltan parámetros requeridos')
      return NextResponse.json(
        { error: 'Se requiere clientId y newStageId' },
        { status: 400 }
      )
    }
    
    // Verificar que el cliente existe y obtener etapa actual
    const client = await prisma.client.findUnique({
      where: { id: clientId, userId: "temp-user-id" },
      include: {
        stage: true  // ✅ Esta relación SÍ existe en tu schema
      }
    })
    
    if (!client) {
      console.log('❌ Cliente no encontrado:', clientId)
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Cliente encontrado:', client.name, 'Etapa actual:', client.stage?.name || 'Sin etapa')
    
    // Verificar que la nueva etapa existe - SIN el include de tasks que no existe
    const newStage = await prisma.stage.findUnique({
      where: { id: newStageId, userId: "temp-user-id" }
      // ❌ REMOVIDO: No incluir 'tasks' porque no existe en tu schema
    })
    
    if (!newStage) {
      console.log('❌ Etapa destino no encontrada:', newStageId)
      return NextResponse.json(
        { error: 'Etapa destino no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Etapa destino encontrada:', newStage.name)
    
    // Si ya está en esa etapa, no hacer nada
    if (client.stageId === newStageId) {
      console.log('⚠️ Cliente ya está en esa etapa')
      return NextResponse.json({
        success: true,
        message: 'Cliente ya está en esa etapa'
      })
    }
    
    console.log(`🔄 Moviendo cliente de "${client.stage?.name || 'Sin etapa'}" a "${newStage.name}"`)
    
    // Actualizar cliente - USAR EL CAMPO CORRECTO del schema
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        stageId: newStageId,
        stageEnteredAt: new Date(), // ✅ Campo correcto según tu schema
        updatedAt: new Date()
      },
      include: {
        stage: true
      }
    })
    
    console.log('✅ Cliente actualizado en base de datos')
    
    // Registrar el movimiento en interactions - SIN campos que no existen
    try {
      await prisma.interaction.create({
        data: {
          clientId,
          userId: "temp-user-id",
          type: 'stage_change',
          notes: notes || `Movido a etapa "${newStage.name}"`,
          // ❌ REMOVIDO: metadata no existe en tu schema
          amount: null // El campo amount existe y puede ser null
        }
      })
      console.log('✅ Interacción de cambio registrada')
    } catch (interactionError) {
      console.log('⚠️ Error registrando interacción (no crítico):', interactionError)
      // No fallar la operación principal por esto
    }
    
    console.log('🎉 Movimiento completado exitosamente')
    
    return NextResponse.json({
      success: true,
      client: updatedClient,
      message: `${client.name} movido a ${newStage.name}`,
      fromStage: client.stage?.name || 'Sin etapa',
      toStage: newStage.name
    })
    
  } catch (error) {
    console.error('❌ Error moving client stage:', error)
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error('❌ Error name:', error.name)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Error al mover cliente de etapa',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// GET - Obtener historial de movimientos de etapa de un cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Se requiere clientId' },
        { status: 400 }
      )
    }
    
    const stageHistory = await prisma.interaction.findMany({
      where: {
        clientId,
        userId: "temp-user-id",
        type: 'stage_change'
      },
      orderBy: { date: 'desc' },
      take: 20 // Últimos 20 movimientos
    })
    
    return NextResponse.json(stageHistory)
  } catch (error) {
    console.error('Error fetching stage history:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de etapas' },
      { status: 500 }
    )
  }
}