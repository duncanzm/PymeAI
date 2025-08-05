// src/app/api/ai/pipeline-insights/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'

export async function POST() {
  try {
    // Obtener datos del pipeline
    const [stages, clients] = await Promise.all([
      prisma.stage.findMany({
        where: { userId: "temp-user-id" },
        orderBy: { order: 'asc' }
      }),
      prisma.client.findMany({
        where: { userId: "temp-user-id" },
        include: { stage: true }
      })
    ])

    // Filtrar solo clientes en el pipeline
    const pipelineClients = clients.filter(c => c.stageId)
    
    if (pipelineClients.length === 0) {
      return NextResponse.json({
        insights: [{
          type: 'info',
          message: 'No hay clientes en el pipeline aún. Comienza agregando algunos clientes a las etapas.',
          priority: 'medium',
          actionable: true
        }]
      })
    }

    // Calcular métricas para la IA
    const now = new Date()
    const clientsPerStage = stages.map(stage => ({
      stageName: stage.name,
      count: pipelineClients.filter(c => c.stageId === stage.id).length,
      avgDays: pipelineClients
        .filter(c => c.stageId === stage.id && c.stageEnteredAt)
        .reduce((sum, c) => {
          const days = Math.floor(
            (now.getTime() - new Date(c.stageEnteredAt!).getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / Math.max(1, pipelineClients.filter(c => c.stageId === stage.id).length),
      totalValue: pipelineClients
        .filter(c => c.stageId === stage.id)
        .reduce((sum, c) => sum + c.totalSpent, 0)
    }))

    // Identificar clientes estancados
    const stuckClients = pipelineClients.filter(client => {
      if (!client.stageEnteredAt) return false
      const daysSinceEntered = Math.floor(
        (now.getTime() - new Date(client.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceEntered > 15 // Más de 15 días en la misma etapa
    })

    // Clientes de alto valor
    const highValueClients = pipelineClients.filter(c => c.totalSpent > 200000)
    
    // Clientes con riesgo de fuga
    const atRiskClients = pipelineClients.filter(c => 
      c.churnRisk && c.churnRisk > 0.7
    )

    // Preparar prompt para OpenAI
    const prompt = `
Analiza este pipeline de ventas y genera 3-5 insights accionables:

Datos del Pipeline:
${clientsPerStage.map(stage => 
  `- ${stage.stageName}: ${stage.count} clientes, promedio ${Math.round(stage.avgDays)} días, valor ₡${stage.totalValue.toLocaleString()}`
).join('\n')}

Situaciones específicas:
- ${stuckClients.length} clientes llevan más de 15 días en la misma etapa
- ${highValueClients.length} clientes de alto valor (>₡200,000)
- ${atRiskClients.length} clientes con alto riesgo de fuga
- Total clientes en pipeline: ${pipelineClients.length}

Genera insights en formato JSON:
{
  "insights": [
    {
      "type": "bottleneck|opportunity|risk|conversion|optimization",
      "message": "insight específico y accionable",
      "priority": "high|medium|low",
      "actionable": true|false,
      "recommendation": "acción específica a tomar"
    }
  ]
}

Enfócate en:
1. Cuellos de botella en etapas específicas
2. Oportunidades de conversión
3. Clientes que necesitan atención urgente
4. Patrones de comportamiento
5. Recomendaciones específicas

Sé específico con nombres de etapas y números. Usa un tono profesional pero directo.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 600,
    })

    const aiResponse = response.choices[0].message.content
    const insights = aiResponse ? JSON.parse(aiResponse) : { insights: [] }

    // Agregar insights específicos basados en datos
    const additionalInsights = []

    // Insight sobre clientes estancados
    if (stuckClients.length > 0) {
      const stageWithMostStuck = clientsPerStage.reduce((max, stage) => 
        stuckClients.filter(c => stages.find(s => s.id === c.stageId)?.name === stage.stageName).length > 
        stuckClients.filter(c => stages.find(s => s.id === c.stageId)?.name === max.stageName).length 
        ? stage : max
      )

      additionalInsights.push({
        type: 'bottleneck',
        message: `${stuckClients.length} clientes llevan más de 15 días sin avanzar. La etapa "${stageWithMostStuck.stageName}" tiene el mayor cuello de botella.`,
        priority: 'high',
        actionable: true,
        recommendation: `Revisar y contactar clientes en "${stageWithMostStuck.stageName}" para identificar obstáculos`
      })
    }

    // Insight sobre clientes de alto valor
    if (highValueClients.length > 0) {
      additionalInsights.push({
        type: 'opportunity',
        message: `Tienes ${highValueClients.length} clientes de alto valor en el pipeline (>₡200,000). Estos representan una gran oportunidad.`,
        priority: 'high',
        actionable: true,
        recommendation: 'Priorizar seguimiento personalizado para clientes de alto valor'
      })
    }

    // Insight sobre distribución desigual
    const maxClientsInStage = Math.max(...clientsPerStage.map(s => s.count))
    const minClientsInStage = Math.min(...clientsPerStage.map(s => s.count))
    
    if (maxClientsInStage > minClientsInStage * 3 && minClientsInStage > 0) {
      const heaviestStage = clientsPerStage.find(s => s.count === maxClientsInStage)
      additionalInsights.push({
        type: 'optimization',
        message: `La etapa "${heaviestStage?.stageName}" tiene ${maxClientsInStage} clientes, creando un posible cuello de botella.`,
        priority: 'medium',
        actionable: true,
        recommendation: 'Considerar subdividir esta etapa o acelerar el proceso'
      })
    }

    // Combinar insights de IA con insights calculados
    const allInsights = [
      ...(insights.insights || []),
      ...additionalInsights
    ].slice(0, 5) // Máximo 5 insights para no sobrecargar

    // Guardar insights en la base de datos
    await prisma.aIInsight.create({
      data: {
        type: 'pipeline_analysis',
        content: {
          insights: allInsights,
          metrics: {
            totalClients: pipelineClients.length,
            stuckClients: stuckClients.length,
            highValueClients: highValueClients.length,
            atRiskClients: atRiskClients.length
          },
          generated_at: now.toISOString()
        },
        priority: allInsights.some(i => i.priority === 'high') ? 2 : 1,
        userId: "temp-user-id"
      }
    })

    return NextResponse.json({ insights: allInsights })

  } catch (error) {
    console.error('Error generating pipeline insights:', error)
    
    // Fallback con insights básicos
    return NextResponse.json({
      insights: [
        {
          type: 'info',
          message: 'No se pudieron generar insights automáticos. Revisa la configuración de IA.',
          priority: 'low',
          actionable: false,
          recommendation: 'Verificar conexión con OpenAI'
        }
      ]
    })
  }
}