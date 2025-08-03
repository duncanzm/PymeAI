import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json()

    // Determinar si necesita datos o gráficas
    const needsData = await analyzeIntent(message)
    
    let additionalContext = ''
    let chartData = null

    // Si necesita datos, obtenerlos
    if (needsData.type) {
      const data = await fetchRelevantData(needsData.type)
      additionalContext = `\nDatos actuales del negocio: ${JSON.stringify(data)}`
      
      // Generar datos para gráficas si es necesario
      if (needsData.needsChart) {
        chartData = formatChartData(needsData.type, data)
      }
    }

    // Llamar a OpenAI con el contexto
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres Kuna, un asistente de IA amigable y profesional para un sistema CRM. 
          Tu personalidad:
          - Eres entusiasta pero profesional
          - Usas emojis ocasionalmente para ser amigable
          - Das respuestas concisas pero completas
          - Cuando muestras datos, los presentas de forma clara
          - Si el usuario está en una página específica, tomas eso en cuenta
          - Eres experto en ventas, clientes y análisis de negocio
          - NUNCA uses corchetes [] para describir elementos visuales
          - NUNCA escribas cosas como "[Gráfica de...]" o "[Imagen de...]"
          - Habla de forma natural sobre los datos, no describas lo que se muestra
          ${chartData ? '\n- IMPORTANTE: Se mostrará automáticamente una gráfica visual al usuario. Solo comenta los insights clave de los datos de forma conversacional, como "¡Aquí están tus ventas!" o "Como puedes ver en la gráfica..."' : ''}
          
          Contexto actual:
          - Página actual del usuario: ${context.currentPage}
          ${additionalContext}`
        },
        ...context.previousMessages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return NextResponse.json({
      message: completion.choices[0].message.content,
      chart: chartData
    })

  } catch (error) {
    console.error('Error en chat:', error)
    return NextResponse.json(
      { message: 'Lo siento, tuve un problema al procesar tu solicitud.' },
      { status: 500 }
    )
  }
}

async function analyzeIntent(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // Detectar solicitudes de gráficas
  const wantsChart = lowerMessage.includes('gráfica') || 
                     lowerMessage.includes('grafica') || 
                     lowerMessage.includes('muestra') || 
                     lowerMessage.includes('ver') ||
                     lowerMessage.includes('visualiza')
  
  // Detectar intenciones mejoradas
  if ((lowerMessage.includes('venta') || lowerMessage.includes('ingreso')) && 
      (lowerMessage.includes('hoy') || lowerMessage.includes('día') || lowerMessage.includes('diaria'))) {
    return { type: 'daily_sales', needsChart: wantsChart }
  }
  
  // Si solo pide gráfica de ventas sin especificar período, mostrar análisis semanal
  if ((lowerMessage.includes('gráfica') || lowerMessage.includes('grafica')) && 
      lowerMessage.includes('venta')) {
    return { type: 'period_analysis', needsChart: true }
  }
  
  // Mejorar detección de clientes
  if (lowerMessage.includes('cliente') && 
      (lowerMessage.includes('mejor') || lowerMessage.includes('top') || 
       lowerMessage.includes('más') || lowerMessage.includes('compra') ||
       lowerMessage.includes('quien') || lowerMessage.includes('quién'))) {
    return { type: 'top_clients', needsChart: false }
  }
  
  if ((lowerMessage.includes('producto') || lowerMessage.includes('artículo')) && 
      (lowerMessage.includes('vendid') || lowerMessage.includes('popular') || lowerMessage.includes('mejor'))) {
    return { type: 'top_products', needsChart: true }
  }
  
  if (lowerMessage.includes('semana') || lowerMessage.includes('semanal') || 
      lowerMessage.includes('últimos días') || lowerMessage.includes('ultimos dias')) {
    return { type: 'period_analysis', needsChart: true }
  }
  
  if (lowerMessage.includes('mes') || lowerMessage.includes('mensual')) {
    return { type: 'period_analysis', needsChart: true }
  }
  
  if (lowerMessage.includes('predicción') || lowerMessage.includes('prediccion') || 
      lowerMessage.includes('futuro') || lowerMessage.includes('pronóstico')) {
    return { type: 'prediction', needsChart: true }
  }
  
  return { type: null, needsChart: false }
}

async function fetchRelevantData(type: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // TODO: Obtener el userId real del usuario autenticado
  // Por ahora usamos un userId de ejemplo o datos simulados
  
  switch (type) {
    case 'daily_sales':
      try {
        const todaySales = await prisma.interaction.aggregate({
          where: {
            date: { gte: today },
            type: 'purchase'
          },
          _sum: { amount: true },
          _count: true
        })
        
        const yesterdaySales = await prisma.interaction.aggregate({
          where: {
            date: {
              gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
              lt: today
            },
            type: 'purchase'
          },
          _sum: { amount: true }
        })
        
        return {
          today: todaySales._sum.amount || 0,
          count: todaySales._count,
          yesterday: yesterdaySales._sum.amount || 0,
          growth: calculateGrowth(todaySales._sum.amount || 0, yesterdaySales._sum.amount || 0)
        }
      } catch (error) {
        // Si hay error, devolver datos simulados
        return {
          today: 125000,
          count: 23,
          yesterday: 108000,
          growth: 16
        }
      }
    
    case 'top_clients':
      try {
        const clients = await prisma.client.findMany({
          include: {
            interactions: {
              where: { type: 'purchase' }
            }
          },
          take: 5,
          orderBy: { totalSpent: 'desc' }
        })
        
        if (clients.length > 0) {
          return clients.map(c => ({
            name: c.name,
            totalSpent: c.totalSpent,
            visits: c.visitCount
          }))
        }
      } catch (error) {
        console.log('Error fetching clients:', error)
      }
      
      // Datos simulados si no hay clientes
      return [
        { name: 'María López', totalSpent: 125000, visits: 45 },
        { name: 'Juan Pérez', totalSpent: 98000, visits: 38 },
        { name: 'Ana García', totalSpent: 87000, visits: 32 },
        { name: 'Carlos Rodríguez', totalSpent: 76000, visits: 28 },
        { name: 'Laura Martínez', totalSpent: 65000, visits: 25 }
      ]
    
    case 'top_products':
      // Simulamos productos populares
      return [
        { name: 'Producto A', sales: 145, revenue: 435000 },
        { name: 'Producto B', sales: 123, revenue: 492000 },
        { name: 'Producto C', sales: 89, revenue: 267000 },
        { name: 'Producto D', sales: 67, revenue: 402000 },
        { name: 'Producto E', sales: 45, revenue: 90000 }
      ]
    
    case 'period_analysis':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const dailySales = []
      
      try {
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000)
          const dayData = await prisma.interaction.aggregate({
            where: {
              date: {
                gte: date,
                lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
              },
              type: 'purchase'
            },
            _sum: { amount: true }
          })
          
          dailySales.push({
            date: date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric' }),
            sales: dayData._sum.amount || 0
          })
        }
        
        // Si no hay datos reales, usar simulados
        if (!dailySales.some(d => d.sales > 0)) {
          return [
            { date: 'Lun 26', sales: 95000 },
            { date: 'Mar 27', sales: 125000 },
            { date: 'Mié 28', sales: 110000 },
            { date: 'Jue 29', sales: 135000 },
            { date: 'Vie 30', sales: 145000 },
            { date: 'Sáb 31', sales: 98000 },
            { date: 'Dom 1', sales: 87000 }
          ]
        }
        
        return dailySales
      } catch (error) {
        console.log('Error fetching period analysis:', error)
      }
      
      // Datos simulados si hay error
      return [
        { date: 'Lun 26', sales: 95000 },
        { date: 'Mar 27', sales: 125000 },
        { date: 'Mié 28', sales: 110000 },
        { date: 'Jue 29', sales: 135000 },
        { date: 'Vie 30', sales: 145000 },
        { date: 'Sáb 31', sales: 98000 },
        { date: 'Dom 1', sales: 87000 }
      ]
    
    default:
      return null
  }
}

function formatChartData(type: string, data: any) {
  switch (type) {
    case 'daily_sales':
      return null // Para ventas diarias no necesitamos gráfica adicional
    
    case 'top_clients':
      return {
        type: 'bar' as const,
        data: data.map((client: any) => ({
          name: client.name.split(' ')[0], // Solo primer nombre
          value: client.totalSpent
        })),
        config: {
          xKey: 'name',
          yKey: 'value'
        }
      }
    
    case 'top_products':
      return {
        type: 'pie' as const,
        data: data.map((product: any) => ({
          name: product.name,
          value: product.sales
        }))
      }
    
    case 'period_analysis':
      return {
        type: 'line' as const,
        data: data,
        config: {
          xKey: 'date',
          yKey: 'sales'
        }
      }
    
    default:
      return null
  }
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 100)
}