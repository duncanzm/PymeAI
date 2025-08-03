// src/app/api/clients/seed/reset/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Primero, eliminar todos los clientes existentes
    const deletedCount = await prisma.client.deleteMany({
      where: { userId: "temp-user-id" }
    })

    return NextResponse.json({
      message: `Se eliminaron ${deletedCount.count} clientes. Ahora puedes ejecutar el seed nuevamente.`,
      deletedCount: deletedCount.count
    })
  } catch (error) {
    console.error('Error resetting clients:', error)
    return NextResponse.json(
      { error: 'Error al eliminar clientes' },
      { status: 500 }
    )
  }
}

// DELETE también funciona
export async function DELETE() {
  return POST()
}