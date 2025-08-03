// src/app/api/ai/predict-sales/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { predictSales } from '@/lib/openai'

export async function POST() {
  try {
    // Obtener datos históricos de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Obtener todas las interacciones de compra
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: "temp-user-id",
        type: 'purchase',
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    // Agrupar por día
    const salesByDay = interactions.reduce((acc, interaction) => {
      const date = new Date(interaction.date).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += interaction.amount || 0
      return acc
    }, {} as Record<string, number>)
    
    // Crear array de datos históricos
    const historicalData = []
    const today = new Date()
    
    // Llenar los últimos 30 días (incluyendo días sin ventas)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      historicalData.push({
        date: dateStr,
        amount: salesByDay[dateStr] || 0
      })
    }
    
    // Si no hay suficientes datos, generar datos de ejemplo
    if (historicalData.filter(d => d.amount > 0).length < 7) {
      // Generar datos de ejemplo basados en patrones típicos de cafetería
      const baseAmount = 80000 // Base diaria
      const weekendMultiplier = 1.3
      const weekdayVariation = 0.2
      
      historicalData.forEach((day, index) => {
        if (day.amount === 0) {
          const date = new Date(day.date)
          const dayOfWeek = date.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          
          // Calcular monto basado en día de la semana
          let amount = baseAmount
          if (isWeekend) {
            amount *= weekendMultiplier
          }
          
          // Agregar variación aleatoria
          amount += (Math.random() - 0.5) * baseAmount * weekdayVariation
          
          day.amount = Math.round(amount)
        }
      })
    }
    
    // Predecir con IA
    const predictions = await predictSales(historicalData, 7)
    
    if (!predictions) {
      throw new Error('No se pudieron generar predicciones')
    }
    
    // Guardar insight
    await prisma.aIInsight.create({
      data: {
        type: 'sales_prediction',
        content: {
          predictions: predictions.predictions,
          insights: predictions.insights,
          recommendations: predictions.recommendations,
          generatedAt: new Date().toISOString()
        },
        priority: 1,
        userId: "temp-user-id"
      }
    })
    
    return NextResponse.json({
      historical: historicalData.slice(-7), // Últimos 7 días
      predictions: predictions.predictions,
      insights: predictions.insights,
      recommendations: predictions.recommendations
    })
  } catch (error) {
    console.error('Error predicting sales:', error)
    return NextResponse.json(
      { error: 'Error al predecir ventas' },
      { status: 500 }
    )
  }
}