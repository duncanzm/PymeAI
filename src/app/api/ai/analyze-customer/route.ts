// src/app/api/ai/analyze-customer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeCustomer } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Cliente ID requerido' },
        { status: 400 }
      )
    }
    
    // Obtener datos del cliente
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }
    
    // Calcular días desde última visita
    const daysSinceLastVisit = client.lastVisit 
      ? Math.floor((new Date().getTime() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    
    // Analizar con IA
    const analysis = await analyzeCustomer({
      name: client.name,
      totalSpent: client.totalSpent,
      visitCount: client.visitCount,
      lastVisit: client.lastVisit,
      averageSpent: client.averageSpent || 0,
      daysSinceLastVisit
    })
    
    if (analysis) {
      // Guardar insight
      await prisma.aIInsight.create({
        data: {
          type: 'customer_analysis',
          content: {
            clientId,
            clientName: client.name,
            analysis,
            analyzedAt: new Date().toISOString()
          },
          priority: analysis.riskLevel > 70 ? 2 : 1,
          userId: "temp-user-id"
        }
      })
      
      // Actualizar cliente con scores de IA
      await prisma.client.update({
        where: { id: clientId },
        data: {
          churnRisk: analysis.riskLevel / 100,
          loyaltyScore: analysis.status === 'vip' ? 90 : 
                       analysis.status === 'activo' ? 70 : 
                       analysis.status === 'en_riesgo' ? 40 : 20
        }
      })
    }
    
    return NextResponse.json({ 
      client: {
        ...client,
        daysSinceLastVisit
      },
      analysis 
    })
  } catch (error) {
    console.error('Error analyzing customer:', error)
    return NextResponse.json(
      { error: 'Error al analizar cliente' },
      { status: 500 }
    )
  }
}