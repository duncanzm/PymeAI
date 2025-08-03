// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los clientes
export async function GET() {
  try {
    // @ts-ignore - Temporal mientras se arregla el tipo
    const clients = await prisma.client.findMany({
      where: {
        userId: "temp-user-id"
      },
      orderBy: {
        createdAt: 'desc'
      } 
    })
    
    // Parsear las tags de JSON string a array
    const clientsWithParsedTags = clients.map(client => ({
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : []
    }))
    
    return NextResponse.json(clientsWithParsedTags)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone,
      idType,
      idNumber,
      address,
      company,
      occupation,
      birthday,
      notes,
      tags
    } = body
    
    // Validación básica
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Crear el cliente con todos los campos
    // @ts-ignore - Temporal mientras se arregla el tipo
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        idType: idType?.trim() || null,
        idNumber: idNumber?.trim() || null,
        address: address?.trim() || null,
        company: company?.trim() || null,
        occupation: occupation?.trim() || null,
        birthday: birthday || null,
        notes: notes?.trim() || null,
        tags: JSON.stringify(tags || []), // SQLite necesita strings para arrays
        userId: "temp-user-id",
        totalSpent: 0,
        visitCount: 0,
        averageSpent: 0,
        lastVisit: null
      }
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}