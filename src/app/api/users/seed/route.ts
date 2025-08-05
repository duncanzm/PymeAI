// src/app/api/users/seed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { id: "temp-user-id" }
    })

    if (existingUser) {
      return NextResponse.json({
        message: "Usuario temporal ya existe",
        user: existingUser
      })
    }

    // Crear usuario temporal
    const user = await prisma.user.create({
      data: {
        id: "temp-user-id",
        email: "demo@ejemplo.com",
        name: "Usuario Demo",
        businessName: "Mi Negocio Demo",
        businessType: "cafeteria"
      }
    })

    return NextResponse.json({
      message: "Usuario temporal creado",
      user
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating temp user:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario: ' + error },
      { status: 500 }
    )
  }
}