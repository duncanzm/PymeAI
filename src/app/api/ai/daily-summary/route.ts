// src/app/api/ai/daily-summary/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDailySummary } from '@/lib/openai'

export async function POST() {
  try {
    // Obtener métricas del día
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Contar interacciones de hoy
    const todayInteractions = await prisma.interaction.findMany({
      where: {
        userId: "temp-user-id",
        date: {
          gte: today
        }
      }
    })
    
    // Calcular métricas
    const totalSales = todayInteractions
      .filter(i => i.type === 'purchase')
      .reduce((sum, i) => sum + (i.amount || 0), 0)
    
    const customerCount = new Set(todayInteractions.map(i => i.clientId)).size
    
    const averageTicket = customerCount > 0 ? Math.round(totalSales / customerCount) : 0
    
    // Contar clientes nuevos (creados hoy)
    const newCustomers = await prisma.client.count({
      where: {
        userId: "temp-user-id",
        createdAt: {
          gte: today
        }
      }
    })
    
    const returningCustomers = customerCount - newCustomers
    
    // Generar resumen con IA
    const summary = await generateDailySummary({
      totalSales,
      customerCount,
      averageTicket,
      newCustomers,
      returningCustomers
    })
    
    // Guardar el insight en la base de datos
    const insight = await prisma.aIInsight.create({
      data: {
        type: 'daily_summary',
        content: {
          summary,
          metrics: {
            totalSales,
            customerCount,
            averageTicket,
            newCustomers,
            returningCustomers
          },
          date: today.toISOString()
        },
        priority: 1,
        userId: "temp-user-id"
      }
    })
    
    return NextResponse.json({
      summary,
      metrics: {
        totalSales,
        customerCount,
        averageTicket,
        newCustomers,
        returningCustomers
      }
    })
  } catch (error) {
    console.error('Error generating daily summary:', error)
    return NextResponse.json(
      { error: 'Error al generar resumen diario' },
      { status: 500 }
    )
  }
}