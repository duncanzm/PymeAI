import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/clients/[id] - Obtener un cliente específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        interactions: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener el cliente' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Actualizar un cliente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        idNumber: body.idNumber,
        idType: body.idType,
        address: body.address,
        company: body.company,
        occupation: body.occupation,
        birthday: body.birthday,
        notes: body.notes,
        tags: body.tags,
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el cliente' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Eliminar un cliente
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.client.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el cliente' },
      { status: 500 }
    )
  }
}