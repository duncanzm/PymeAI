// src/app/api/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Crear nueva interacción
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, type, amount, notes } = body
    
    // Validación
    if (!clientId || !type) {
      return NextResponse.json(
        { error: 'Cliente y tipo son requeridos' },
        { status: 400 }
      )
    }
    
    // Crear la interacción
    const interaction = await prisma.interaction.create({
      data: {
        clientId,
        userId: "temp-user-id",
        type,
        amount: amount || 0,
        notes: notes || null,
      }
    })
    
    // Actualizar estadísticas del cliente
    if (type === 'purchase' && amount) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          totalSpent: { increment: amount },
          visitCount: { increment: 1 },
          lastVisit: new Date(),
          averageSpent: {
            set: await calculateAverageSpent(clientId)
          }
        }
      })
    } else if (type === 'visit') {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          visitCount: { increment: 1 },
          lastVisit: new Date()
        }
      })
    }
    
    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Error al crear interacción' },
      { status: 500 }
    )
  }
}

// GET - Obtener interacciones de un cliente
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
    
    const interactions = await prisma.interaction.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: 50 // Últimas 50 interacciones
    })
    
    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Error al obtener interacciones' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular promedio
async function calculateAverageSpent(clientId: string) {
  const result = await prisma.interaction.aggregate({
    where: {
      clientId,
      type: 'purchase',
      amount: { gt: 0 }
    },
    _avg: {
      amount: true
    }
  })
  
  return result._avg.amount || 0
}