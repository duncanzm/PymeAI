// src/app/api/clients/assign-stages/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Obtener todas las etapas
    const stages = await prisma.stage.findMany({
      orderBy: { order: 'asc' }
    })
    
    if (stages.length === 0) {
      return NextResponse.json(
        { error: 'No hay etapas creadas' },
        { status: 400 }
      )
    }
    
    // Obtener clientes sin etapa asignada
    const clientsWithoutStage = await prisma.client.findMany({
      where: {
        stageId: null
      }
    })
    
    console.log(`Encontrados ${clientsWithoutStage.length} clientes sin etapa`)
    
    // Asignar etapas inteligentemente según el comportamiento del cliente
    const updates = []
    
    for (const client of clientsWithoutStage) {
      let targetStage = stages[0] // Por defecto "Prospecto"
      
      // Lógica inteligente de asignación
      if (client.visitCount === 0) {
        // Sin visitas = Prospecto
        targetStage = stages.find(s => s.name === 'Prospecto') || stages[0]
      } else if (client.visitCount >= 1 && client.visitCount <= 3) {
        // 1-3 visitas = Cliente Nuevo
        targetStage = stages.find(s => s.name === 'Cliente Nuevo') || stages[1] || stages[0]
      } else if (client.visitCount >= 4 && client.visitCount <= 15) {
        // 4-15 visitas = Cliente Regular
        targetStage = stages.find(s => s.name === 'Cliente Regular') || stages[2] || stages[0]
      } else if (client.visitCount > 15 || client.totalSpent > 200000) {
        // Muchas visitas o alto valor = VIP
        targetStage = stages.find(s => s.name === 'Cliente VIP') || stages[3] || stages[0]
      }
      
      // Verificar tags especiales
      const tags = JSON.parse(client.tags || '[]')
      if (tags.some((tag: string) => 
        tag.toLowerCase().includes('vip') || 
        tag.toLowerCase().includes('oro') || 
        tag.toLowerCase().includes('premium')
      )) {
        targetStage = stages.find(s => s.name === 'Cliente VIP') || stages[3] || stages[0]
      }
      
      updates.push({
        clientId: client.id,
        stageId: targetStage.id,
        stageName: targetStage.name
      })
    }
    
    // Ejecutar todas las actualizaciones
    const results = await Promise.all(
      updates.map(update => 
        prisma.client.update({
          where: { id: update.clientId },
          data: { 
            stageId: update.stageId,
            stageEnteredAt: new Date()
          }
        })
      )
    )
    
    // Contar clientes por etapa después de la asignación
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.client.count({
          where: { stageId: stage.id }
        })
        return { stage: stage.name, count }
      })
    )
    
    return NextResponse.json({
      message: `${results.length} clientes asignados a etapas exitosamente`,
      assignments: updates,
      stageCounts
    })
    
  } catch (error) {
    console.error('Error assigning clients to stages:', error)
    return NextResponse.json(
      { error: 'Error al asignar clientes a etapas' },
      { status: 500 }
    )
  }
}