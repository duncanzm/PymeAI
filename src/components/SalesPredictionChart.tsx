"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Loader2, AlertCircle, CheckCircle, Calendar } from "lucide-react"

interface PredictionData {
  date: string
  amount: number
  confidence?: number
  dayOfWeek?: string
  type?: 'historical' | 'prediction'
}

export default function SalesPredictionChart() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    historical: any[]
    predictions: any[]
    insights: string[]
    recommendations: string[]
  } | null>(null)

  const generatePredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/predict-sales', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Combinar datos históricos y predicciones para el gráfico
  const chartData = data ? [
    ...data.historical.map(d => ({
      ...d,
      type: 'historical',
      displayDate: new Date(d.date).toLocaleDateString('es-CR', { 
        day: 'numeric', 
        month: 'short' 
      })
    })),
    ...data.predictions.map(d => ({
      ...d,
      type: 'prediction',
      displayDate: new Date(d.date).toLocaleDateString('es-CR', { 
        day: 'numeric', 
        month: 'short',
        weekday: 'short'
      })
    }))
  ] : []

  // Formatear moneda para el tooltip
  const formatCurrency = (value: number) => {
    return `₡${value.toLocaleString()}`
  }

  // Obtener color según el nivel de confianza
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predicción de Ventas con IA
            </CardTitle>
            <CardDescription>
              Análisis histórico y proyección de los próximos 7 días
            </CardDescription>
          </div>
          <Button
            onClick={generatePredictions}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Generar Predicción
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Haz clic en "Generar Predicción" para ver el análisis de ventas futuras
            </p>
            <p className="text-sm text-gray-400">
              La IA analizará tus patrones de venta y predecirá los próximos 7 días
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayDate" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  
                  {/* Línea de datos históricos */}
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Ventas reales"
                    data={chartData.filter(d => d.type === 'historical')}
                  />
                  
                  {/* Línea de predicciones */}
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="Predicción IA"
                    data={chartData.filter(d => d.type === 'prediction')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Predicciones detalladas */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Predicción Detallada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.predictions.map((pred, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium">
                          {new Date(pred.date).toLocaleDateString('es-CR', { 
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        <p className="text-xl font-bold">
                          {formatCurrency(pred.amount)}
                        </p>
                      </div>
                      <span className={`text-sm ${getConfidenceColor(pred.confidence || 70)}`}>
                        {pred.confidence}% certeza
                      </span>
                    </div>
                    {pred.amount > 100000 && (
                      <p className="text-xs text-green-600 mt-1">
                        📈 Día alto - Preparar más inventario
                      </p>
                    )}
                    {pred.amount < 70000 && (
                      <p className="text-xs text-orange-600 mt-1">
                        📉 Día bajo - Considerar promoción
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Insights de IA */}
            {data.insights && data.insights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Insights de IA
                </h4>
                <ul className="space-y-2">
                  {data.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {data.recommendations && data.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recomendaciones
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-blue-50 border border-blue-200"
                    >
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Predicción total próximos 7 días</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.predictions.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Promedio diario esperado</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(Math.round(data.predictions.reduce((sum, p) => sum + p.amount, 0) / 7))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}