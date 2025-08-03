export interface ValidationError {
  field: string
  message: string
}

export interface ClientValidation {
  name: string
  email: string | null
  phone: string | null
  idType: string | null
  idNumber: string | null
  occupation: string | null
  company: string | null
  birthday: string | null
  address: string | null
  notes: string | null
  tags: string[]
}

// Validación de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validación de teléfono de Costa Rica
export const isValidPhoneCR = (phone: string): boolean => {
  // Acepta formatos: 8888-8888, 88888888, +506 8888-8888, +50688888888
  const phoneRegex = /^(\+506\s?)?[2-8]\d{3}[-\s]?\d{4}$/
  const cleanPhone = phone.replace(/\s/g, '').replace(/-/g, '')
  return phoneRegex.test(phone) || /^(\+506)?[2-8]\d{7}$/.test(cleanPhone)
}

// Validación de cédula de Costa Rica
export const isValidCedulaCR = (cedula: string): boolean => {
  // Formato: 1-2345-6789 o 123456789
  const cedulaRegex = /^[1-9]-?\d{4}-?\d{4}$/
  const cleanCedula = cedula.replace(/-/g, '')
  return cedulaRegex.test(cedula) || /^[1-9]\d{8}$/.test(cleanCedula)
}

// Validación de fecha de nacimiento
export const isValidBirthday = (birthday: string): boolean => {
  const date = new Date(birthday)
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  
  return date >= minDate && date <= maxDate
}

// Validación completa del cliente
export const validateClient = (client: Partial<ClientValidation>): ValidationError[] => {
  const errors: ValidationError[] = []

  // Nombre (requerido)
  if (!client.name || client.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre es requerido' })
  } else if (client.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres' })
  } else if (client.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'El nombre no puede tener más de 100 caracteres' })
  }

  // Email (opcional pero debe ser válido si se proporciona)
  if (client.email && client.email.trim().length > 0) {
    if (!isValidEmail(client.email.trim())) {
      errors.push({ field: 'email', message: 'El email no es válido' })
    }
  }

  // Teléfono (opcional pero debe ser válido si se proporciona)
  if (client.phone && client.phone.trim().length > 0) {
    if (!isValidPhoneCR(client.phone.trim())) {
      errors.push({ field: 'phone', message: 'El teléfono no es válido. Formato: 8888-8888 o +506 8888-8888' })
    }
  }

  // Validación de ID
  if (client.idType && client.idType !== '') {
    if (!client.idNumber || client.idNumber.trim().length === 0) {
      errors.push({ field: 'idNumber', message: 'El número de identificación es requerido si selecciona un tipo' })
    } else if (client.idType === 'cedula') {
      if (!isValidCedulaCR(client.idNumber.trim())) {
        errors.push({ field: 'idNumber', message: 'La cédula no es válida. Formato: 1-2345-6789' })
      }
    } else if (client.idType === 'pasaporte') {
      if (client.idNumber.trim().length < 5 || client.idNumber.trim().length > 20) {
        errors.push({ field: 'idNumber', message: 'El pasaporte debe tener entre 5 y 20 caracteres' })
      }
    }
  }

  // Si hay número de ID pero no tipo
  if (client.idNumber && client.idNumber.trim().length > 0 && !client.idType) {
    errors.push({ field: 'idType', message: 'Debe seleccionar un tipo de identificación' })
  }

  // Fecha de nacimiento (opcional pero debe ser válida si se proporciona)
  if (client.birthday && client.birthday.trim().length > 0) {
    if (!isValidBirthday(client.birthday)) {
      errors.push({ field: 'birthday', message: 'La fecha de nacimiento no es válida (debe ser mayor de 18 años)' })
    }
  }

  // Ocupación (opcional pero con límite de caracteres)
  if (client.occupation && client.occupation.trim().length > 100) {
    errors.push({ field: 'occupation', message: 'La ocupación no puede tener más de 100 caracteres' })
  }

  // Empresa (opcional pero con límite de caracteres)
  if (client.company && client.company.trim().length > 100) {
    errors.push({ field: 'company', message: 'El nombre de la empresa no puede tener más de 100 caracteres' })
  }

  // Dirección (opcional pero con límite de caracteres)
  if (client.address && client.address.trim().length > 200) {
    errors.push({ field: 'address', message: 'La dirección no puede tener más de 200 caracteres' })
  }

  // Notas (opcional pero con límite de caracteres)
  if (client.notes && client.notes.trim().length > 500) {
    errors.push({ field: 'notes', message: 'Las notas no pueden tener más de 500 caracteres' })
  }

  // Tags
  if (client.tags && client.tags.length > 10) {
    errors.push({ field: 'tags', message: 'No se pueden tener más de 10 etiquetas' })
  }

  return errors
}

// Formatear cédula
export const formatCedula = (cedula: string): string => {
  const clean = cedula.replace(/\D/g, '')
  if (clean.length === 9) {
    return `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5)}`
  }
  return cedula
}

// Formatear teléfono
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`
  }
  if (clean.length === 11 && clean.startsWith('506')) {
    return `+506 ${clean.slice(3, 7)}-${clean.slice(7)}`
  }
  return phone
}