// src/app/api/clients/seed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Datos dummy realistas para Costa Rica
const dummyClients = [
  {
    name: "María Rodríguez Vargas",
    email: "maria.rodriguez@gmail.com",
    phone: "8845-1234",
    idType: "cedula",
    idNumber: "1-1234-5678",
    address: "San José, Escazú, 200m norte del Multiplaza",
    company: "Banco Nacional",
    occupation: "Gerente de Sucursal",
    birthday: "1985-03-15",
    notes: "Cliente VIP, prefiere café americano sin azúcar. Viene todos los días a las 8am.",
    tags: ["VIP", "Fiel", "Mañanas"],
    totalSpent: 450000,
    visitCount: 180,
    averageSpent: 2500,
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Ayer
  },
  {
    name: "Carlos Jiménez Mora",
    email: "carlos.jimenez@outlook.com",
    phone: "7123-4567",
    idType: "cedula",
    idNumber: "2-3456-7890",
    address: "Heredia, San Rafael, Condominio Las Flores #23",
    company: "Intel Costa Rica",
    occupation: "Ingeniero de Software",
    birthday: "1990-07-22",
    notes: "Le gusta el cappuccino con leche de almendras. Trabaja remoto los miércoles.",
    tags: ["Tech", "Remoto", "Cappuccino"],
    totalSpent: 125000,
    visitCount: 45,
    averageSpent: 2777,
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Hace 3 días
  },
  {
    name: "Ana Lucía Campos Solís",
    email: "analucia.campos@yahoo.com",
    phone: "6234-5678",
    idType: "cedula",
    idNumber: "3-4567-8901",
    address: "Alajuela, Centro, Ave 3, Calle 5",
    company: "Clínica Bíblica",
    occupation: "Doctora",
    birthday: "1978-11-30",
    notes: "Médico de turno. Pide café para llevar. Prefiere descafeinado después de las 2pm.",
    tags: ["Médico", "Para llevar", "Descafeinado"],
    totalSpent: 89000,
    visitCount: 35,
    averageSpent: 2542,
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Hace una semana
  },
  {
    name: "Roberto González Quesada",
    email: null,
    phone: "8901-2345",
    idType: "cedula",
    idNumber: "4-5678-9012",
    address: "Cartago, La Unión, Barrio San Rafael",
    company: "Dos Pinos",
    occupation: "Supervisor de Producción",
    birthday: "1982-05-18",
    notes: "Cliente nuevo, recomendado por María Rodríguez. Le gusta el café fuerte.",
    tags: ["Nuevo", "Recomendado"],
    totalSpent: 15000,
    visitCount: 5,
    averageSpent: 3000,
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // Hace 2 días
  },
  {
    name: "Laura Méndez Brenes",
    email: "laura.mendez@gmail.com",
    phone: "7890-1234",
    idType: "pasaporte",
    idNumber: "G12345678",
    address: "San José, Sabana Norte, Torre Mercedes piso 5",
    company: "Microsoft",
    occupation: "Gerente de Proyectos",
    birthday: "1988-09-10",
    notes: "Organiza reuniones de equipo aquí. Pide catering para 10 personas mensualmente.",
    tags: ["Corporativo", "Catering", "Frecuente"],
    totalSpent: 380000,
    visitCount: 52,
    averageSpent: 7307,
    lastVisit: new Date().toISOString() // Hoy
  },
  {
    name: "Diego Fernández Alpízar",
    email: "diego.fa@protonmail.com",
    phone: "6123-4567",
    idType: "cedula",
    idNumber: "1-0987-6543",
    address: "Heredia, Santo Domingo, Residencial El Castillo",
    company: null,
    occupation: "Estudiante",
    birthday: "2001-12-05",
    notes: "Estudiante de medicina UCR. Viene a estudiar, permanece 3-4 horas. WiFi importante.",
    tags: ["Estudiante", "WiFi", "Largas estadías"],
    totalSpent: 45000,
    visitCount: 60,
    averageSpent: 750,
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Ayer
  },
  {
    name: "Patricia Villalobos Chacón",
    email: "paty.villalobos@hotmail.com",
    phone: "8567-8901",
    idType: "cedula",
    idNumber: "2-1111-2222",
    address: "San José, Moravia, La Trinidad",
    company: "Librería Internacional",
    occupation: "Administradora",
    birthday: "1975-02-28",
    notes: "Clienta de años. Trae a sus amigas del club de lectura los sábados.",
    tags: ["Fiel", "Club de lectura", "Fin de semana"],
    totalSpent: 567000,
    visitCount: 200,
    averageSpent: 2835,
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Hace 5 días
  },
  {
    name: "José Miguel Soto Ramírez",
    email: "josemi.soto@gmail.com",
    phone: "7345-6789",
    idType: "residencia",
    idNumber: "155812345678",
    address: "Escazú, San Rafael, Trejos Montealegre",
    company: "Amazon",
    occupation: "Cloud Architect",
    birthday: "1992-06-14",
    notes: "Trabaja desde aquí 2-3 veces por semana. Necesita mesas con tomacorrientes.",
    tags: ["Tech", "Remoto", "Power user"],
    totalSpent: 198000,
    visitCount: 88,
    averageSpent: 2250,
    lastVisit: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // Hace 4 días
  },
  {
    name: "Sofía Hernández Ugalde",
    email: "sofia.hernandez@gmail.com",
    phone: "8234-5678",
    idType: "cedula",
    idNumber: "3-2222-3333",
    address: "Cartago, Centro, Barrio El Carmen",
    company: "CCSS",
    occupation: "Enfermera",
    birthday: "1987-10-20",
    notes: "Viene después de turnos nocturnos. Le gusta el chai latte.",
    tags: ["Salud", "Turnos", "Chai"],
    totalSpent: 34000,
    visitCount: 20,
    averageSpent: 1700,
    lastVisit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // Hace 45 días - En riesgo
  },
  {
    name: "Alejandro Mora Valverde",
    email: null,
    phone: "6789-0123",
    idType: "cedula",
    idNumber: "4-3333-4444",
    address: "Alajuela, San Antonio del Tejar",
    company: "Café Britt",
    occupation: "Catador de Café",
    birthday: "1980-04-08",
    notes: "Experto en café. Buen cliente para probar nuevas mezclas. Muy exigente con la calidad.",
    tags: ["Experto", "Catador", "VIP"],
    totalSpent: 95000,
    visitCount: 40,
    averageSpent: 2375,
    lastVisit: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString() // Hace 70 días - Inactivo
  },
  {
    name: "Gabriela Picado Zúñiga",
    email: "gabi.picado@gmail.com",
    phone: "8456-7890",
    idType: "cedula",
    idNumber: "1-4444-5555",
    address: "San José, Guadalupe, Barrio Pilar",
    company: "La República",
    occupation: "Periodista",
    birthday: "1995-01-25",
    notes: "Viene a escribir artículos. Prefiere mesas tranquilas. Fan del cold brew.",
    tags: ["Periodista", "Cold brew", "Tranquilo"],
    totalSpent: 78000,
    visitCount: 65,
    averageSpent: 1200,
    lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // Hace 10 días
  },
  {
    name: "Fernando Castillo Rojas",
    email: "fernando.castillo@ice.co.cr",
    phone: "7012-3456",
    idType: "cedula",
    idNumber: "2-5555-6666",
    address: "Heredia, Barva, San Pedro",
    company: "ICE",
    occupation: "Ingeniero Eléctrico",
    birthday: "1973-08-12",
    notes: "Cliente ocasional. Viene cuando tiene reuniones en la zona.",
    tags: ["Ocasional", "Reuniones"],
    totalSpent: 23000,
    visitCount: 10,
    averageSpent: 2300,
    lastVisit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Hace 90 días - Alto riesgo
  },
  // Clientes con información mínima - más realista
  {
    name: "Juan",
    email: null,
    phone: null,
    idType: null,
    idNumber: null,
    address: null,
    company: null,
    occupation: null,
    birthday: null,
    notes: "Solo dio su nombre. Paga en efectivo. Cliente regular de las mañanas.",
    tags: ["Mínimo info", "Efectivo", "Mañanas"],
    totalSpent: 67000,
    visitCount: 90,
    averageSpent: 744,
    lastVisit: new Date().toISOString() // Hoy
  },
  {
    name: "Carmen Solano",
    email: null,
    phone: "8888-9999", // Solo dio teléfono
    idType: null,
    idNumber: null,
    address: null,
    company: null,
    occupation: null,
    birthday: null,
    notes: "Prefiere mantener su privacidad. Solo tenemos teléfono para pedidos.",
    tags: ["Privado", "Pedidos"],
    totalSpent: 45000,
    visitCount: 30,
    averageSpent: 1500,
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: "Luis Alberto",
    email: "luisalberto@gmail.com", // Solo nombre y email
    phone: null,
    idType: null,
    idNumber: null,
    address: null,
    company: null,
    occupation: null,
    birthday: null,
    notes: "Recibe promociones por email. No quiso dar más información.",
    tags: ["Email marketing"],
    totalSpent: 12000,
    visitCount: 8,
    averageSpent: 1500,
    lastVisit: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: "Doña Rosa",
    email: null,
    phone: null,
    idType: null,
    idNumber: null,
    address: "Por el parque central", // Dirección vaga
    company: null,
    occupation: null,
    birthday: null,
    notes: "Señora mayor, cliente de años. Todos la conocen como Doña Rosa.",
    tags: ["Senior", "Fiel", "Local"],
    totalSpent: 234000,
    visitCount: 300,
    averageSpent: 780,
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: "Andrea M.",
    email: null,
    phone: "6000-1111",
    idType: null,
    idNumber: null,
    address: null,
    company: "Gobierno", // Info vaga
    occupation: null,
    birthday: null,
    notes: "Funcionaria pública. No especificó institución.",
    tags: ["Gobierno"],
    totalSpent: 56000,
    visitCount: 40,
    averageSpent: 1400,
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export async function POST() {
  try {
    // Verificar si ya hay clientes para evitar duplicados
    const existingClients = await prisma.client.count({
      where: { userId: "temp-user-id" }
    })

    if (existingClients > 0) {
      return NextResponse.json(
        { message: `Ya existen ${existingClients} clientes en la base de datos` },
        { status: 400 }
      )
    }

    // Crear todos los clientes dummy
    const createdClients = await Promise.all(
      dummyClients.map(async (clientData) => {
        const { tags, ...data } = clientData
        
        return await prisma.client.create({
          data: {
            ...data,
            tags: JSON.stringify(tags),
            userId: "temp-user-id"
          }
        })
      })
    )

    return NextResponse.json({
      message: `Se crearon ${createdClients.length} clientes de prueba exitosamente`,
      clients: createdClients
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error seeding clients:', error)
    return NextResponse.json(
      { error: 'Error al crear clientes de prueba' },
      { status: 500 }
    )
  }
}

// GET - Verificar cuántos clientes hay
export async function GET() {
  try {
    const count = await prisma.client.count({
      where: { userId: "temp-user-id" }
    })

    return NextResponse.json({
      count,
      message: count > 0 
        ? `Hay ${count} clientes en la base de datos` 
        : 'No hay clientes. Usa POST para crear clientes de prueba'
    })
  } catch (error) {
    console.error('Error counting clients:', error)
    return NextResponse.json(
      { error: 'Error al contar clientes' },
      { status: 500 }
    )
  }
}