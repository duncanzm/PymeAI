import OpenAI from 'openai'

// Exportar la instancia de OpenAI para usar en otros archivos
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface BusinessMetrics {
  totalSales: number
  customerCount: number
  averageTicket: number
  newCustomers: number
  returningCustomers: number
  topProducts?: string[]
}

export interface CustomerData {
  name: string
  totalSpent: number
  visitCount: number
  lastVisit: Date | string | null
  averageSpent: number
  daysSinceLastVisit: number
}

// Generar resumen diario del negocio
export async function generateDailySummary(metrics: BusinessMetrics, businessType: string = 'negocio') {
  try {
    const prompt = `
Eres un asistente de negocios experto en análisis de datos y ventas.
Analiza estos datos del día y genera un resumen ejecutivo:

Datos de hoy:
- Ventas totales: ₡${metrics.totalSales.toLocaleString()}
- Clientes atendidos: ${metrics.customerCount}
- Ticket promedio: ₡${metrics.averageTicket.toLocaleString()}
- Clientes nuevos: ${metrics.newCustomers}
- Clientes que regresaron: ${metrics.returningCustomers}

Genera un resumen de 3-4 líneas que incluya:
1. Lo más destacado del día
2. Comparación con promedios típicos
3. Una recomendación accionable
4. Un insight sobre el comportamiento de clientes

Sé específico y útil. Usa un tono amigable pero profesional.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    })

    return response.choices[0].message.content || 'No se pudo generar el resumen.'
  } catch (error) {
    console.error('Error generando resumen:', error)
    return 'Error al generar el resumen. Por favor verifica tu API key.'
  }
}

// Analizar un cliente específico
export async function analyzeCustomer(customer: CustomerData, businessType: string = 'negocio') {
  try {
    const prompt = `
Analiza este cliente de un ${businessType} y genera insights accionables:

Cliente: ${customer.name}
- Total gastado: ₡${customer.totalSpent.toLocaleString()}
- Número de visitas: ${customer.visitCount}
- Última visita: ${customer.daysSinceLastVisit > 0 ? `hace ${customer.daysSinceLastVisit} días` : 'hoy'}
- Ticket promedio: ₡${Math.round(customer.averageSpent).toLocaleString()}

Proporciona un análisis en formato JSON con:
1. "riskLevel": número del 0-100 (probabilidad de perder al cliente)
2. "status": "activo", "en_riesgo", "perdido", o "vip"
3. "insights": array de 2-3 observaciones importantes
4. "recommendations": array de 2-3 acciones específicas
5. "estimatedLifetimeValue": valor estimado en los próximos 6 meses
6. "nextBestAction": la acción más importante a tomar

Considera patrones típicos de comportamiento de clientes.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 300,
    })

    const content = response.choices[0].message.content
    return content ? JSON.parse(content) : null
  } catch (error) {
    console.error('Error analizando cliente:', error)
    return null
  }
}

// Generar predicciones de ventas
export async function predictSales(historicalData: Array<{date: string, amount: number}>, days: number = 7) {
  try {
    const prompt = `
Basándote en estos datos históricos de ventas, predice las ventas para los próximos ${days} días.

Datos históricos (últimos 30 días):
${historicalData.map(d => `${d.date}: ₡${d.amount.toLocaleString()}`).join('\n')}

Considera:
- Patrones semanales (fines de semana vs días laborales)
- Tendencias generales
- Factores estacionales

Responde en formato JSON con:
{
  "predictions": [
    {"date": "YYYY-MM-DD", "amount": número, "confidence": 0-100, "dayOfWeek": "día"},
    ...
  ],
  "insights": ["insight1", "insight2"],
  "recommendations": ["recomendación1", "recomendación2"]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 400,
    })

    const content = response.choices[0].message.content
    return content ? JSON.parse(content) : null
  } catch (error) {
    console.error('Error prediciendo ventas:', error)
    return null
  }
}

// Identificar clientes en riesgo
export async function identifyAtRiskCustomers(customers: CustomerData[]) {
  try {
    const prompt = `
Analiza esta lista de clientes e identifica cuáles están en riesgo de no volver.

Clientes:
${customers.map(c => `- ${c.name}: ${c.visitCount} visitas, última hace ${c.daysSinceLastVisit} días, gastó ₡${c.totalSpent.toLocaleString()}`).join('\n')}

Para cada cliente en riesgo, proporciona en formato JSON:
{
  "atRiskCustomers": [
    {
      "name": "nombre",
      "riskLevel": 0-100,
      "reason": "razón específica",
      "suggestedAction": "acción concreta",
      "incentive": "incentivo sugerido"
    }
  ],
  "summary": "resumen general",
  "priorityActions": ["acción1", "acción2"]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 500,
    })

    const content = response.choices[0].message.content
    return content ? JSON.parse(content) : null
  } catch (error) {
    console.error('Error identificando clientes en riesgo:', error)
    return null
  }
}

// Las funciones que agregamos antes para compatibilidad
export async function analyzeDailySummary() {
  // Esta función mantiene compatibilidad con código anterior
  const metrics: BusinessMetrics = {
    totalSales: 125000,
    customerCount: 23,
    averageTicket: 5435,
    newCustomers: 5,
    returningCustomers: 18,
    topProducts: ['Producto A', 'Producto B', 'Producto C']
  }
  
  return generateDailySummary(metrics)
}

export async function analyzeClient(client: any) {
  // Esta función mantiene compatibilidad con código anterior
  const customerData: CustomerData = {
    name: client.name,
    totalSpent: client.totalSpent,
    visitCount: client.visitCount,
    lastVisit: client.lastVisit,
    averageSpent: client.averageTicket || (client.totalSpent / client.visitCount),
    daysSinceLastVisit: client.daysSinceLastVisit || 0
  }
  
  return analyzeCustomer(customerData)
}