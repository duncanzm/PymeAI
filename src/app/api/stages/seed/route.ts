// src/app/api/stages/seed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Verificar si ya hay etapas
    const existingStages = await prisma.stage.count({
      where: { userId: "temp-user-id" }
    })

    if (existingStages > 0) {
      return NextResponse.json({
        message: `Ya existen ${existingStages} etapas`,
        existing: true
      })
    }

    // Etapas por defecto para un negocio genérico
    const defaultStages = [
      {
        name: "Prospecto",
        description: "Cliente potencial identificado",
        color: "blue",
        order: 1,
        userId: "temp-user-id"
      },
      {
        name: "Contactado",
        description: "Primer contacto realizado",
        color: "yellow",
        order: 2,
        userId: "temp-user-id"
      },
      {
        name: "Interesado",
        description: "Muestra interés en el producto/servicio",
        color: "orange",
        order: 3,
        userId: "temp-user-id"
      },
      {
        name: "Negociando",
        description: "En proceso de negociación",
        color: "purple",
        order: 4,
        userId: "temp-user-id"
      },
      {
        name: "Cliente",
        description: "Conversión exitosa",
        color: "green",
        order: 5,
        userId: "temp-user-id"
      }
    ]

    // Crear las etapas
    const createdStages = await Promise.all(
      defaultStages.map(stage =>
        prisma.stage.create({
          data: stage
        })
      )
    )

    return NextResponse.json({
      message: `Se crearon ${createdStages.length} etapas por defecto`,
      stages: createdStages
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating default stages:', error)
    return NextResponse.json(
      { error: 'Error al crear etapas por defecto' },
      { status: 500 }
    )
  }
}