// TypeScript Interface for Church Report
import { prisma } from './db'

// ============================================
// TYPES
// ============================================

export interface ChurchReport {
  id: string
  churchName: string
  region: string
  month: string
  year: number
  osanTama: OsanTamaEntry[]
  gastu: GastuEntry[]
}

export interface OsanTamaEntry {
  id: string
  deskrisaun: string
  montante: number
}

export interface GastuEntry {
  id: string
  gastuBaSaida: string
  montante: number
}

export interface Comment {
  id: string
  page: 'landing' | 'regional' | 'nasional'
  author: string
  content: string
  timestamp: Date
}

// ============================================
// CONSTANTS
// ============================================

// Regions - Only 4 regions
export const REGIONS = [
  'Baucau',
  'Lospalos',
  'Viqueque',
  'Manatuto',
] as const

export type Region = (typeof REGIONS)[number]

// Months in Tetum
export const MONTHS = [
  'Janeiru',
  'Fevereiru',
  'Marsu',
  'Abril',
  'Meiu',
  'Junhu',
  'Julhu',
  'Agostu',
  'Setembru',
  'Outubru',
  'Novembru',
  'Dezembru',
] as const

export type Month = (typeof MONTHS)[number]

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const calculateTotalRevenue = (report: Partial<ChurchReport>): number => {
  if (report.osanTama && report.osanTama.length > 0) {
    return report.osanTama.reduce((sum, entry) => sum + (entry.montante || 0), 0)
  }
  return 0
}

export const calculateTotalExpense = (report: Partial<ChurchReport>): number => {
  if (report.gastu && report.gastu.length > 0) {
    return report.gastu.reduce((sum, entry) => sum + (entry.montante || 0), 0)
  }
  return 0
}

export const calculateBalance = (report: Partial<ChurchReport>): number => {
  return calculateTotalRevenue(report) - calculateTotalExpense(report)
}

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-TL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// ============================================
// DATABASE OPERATIONS
// ============================================

// Get all reports with their entries
export async function getAllReports(): Promise<ChurchReport[]> {
  try {
    const reports = await prisma.churchReport.findMany({
      include: {
        osanTama: true,
        gastu: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return reports.map((report) => ({
      id: report.id,
      churchName: report.churchName,
      region: report.region,
      month: report.month,
      year: report.year,
      osanTama: report.osanTama.map((ot) => ({
        id: ot.id,
        deskrisaun: ot.deskrisaun,
        montante: ot.montante,
      })),
      gastu: report.gastu.map((g) => ({
        id: g.id,
        gastuBaSaida: g.gastuBaSaida,
        montante: g.montante,
      })),
    }))
  } catch (error) {
    console.error('Error fetching reports:', error)
    return []
  }
}

// Create a new report with entries
export async function createReport(data: {
  churchName: string
  region: string
  month: string
  year: number
  osanTama: { deskrisaun: string; montante: number }[]
  gastu: { gastuBaSaida: string; montante: number }[]
}): Promise<ChurchReport | null> {
  try {
    const report = await prisma.churchReport.create({
      data: {
        churchName: data.churchName,
        region: data.region,
        month: data.month,
        year: data.year,
        osanTama: {
          create: data.osanTama,
        },
        gastu: {
          create: data.gastu,
        },
      },
      include: {
        osanTama: true,
        gastu: true,
      },
    })

    return {
      id: report.id,
      churchName: report.churchName,
      region: report.region,
      month: report.month,
      year: report.year,
      osanTama: report.osanTama.map((ot) => ({
        id: ot.id,
        deskrisaun: ot.deskrisaun,
        montante: ot.montante,
      })),
      gastu: report.gastu.map((g) => ({
        id: g.id,
        gastuBaSaida: g.gastuBaSaida,
        montante: g.montante,
      })),
    }
  } catch (error) {
    console.error('Error creating report:', error)
    return null
  }
}

// Delete a report
export async function deleteReport(id: string): Promise<boolean> {
  try {
    await prisma.churchReport.delete({
      where: { id },
    })
    return true
  } catch (error) {
    console.error('Error deleting report:', error)
    return false
  }
}

// Get comments by page
export async function getCommentsByPage(page: Comment['page']): Promise<Comment[]> {
  try {
    const comments = await prisma.comment.findMany({
      where: { page },
      orderBy: { createdAt: 'desc' },
    })

    return comments.map((c) => ({
      id: c.id,
      page: c.page as Comment['page'],
      author: c.author,
      content: c.content,
      timestamp: c.createdAt,
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

// Add a comment
export async function addComment(
  page: Comment['page'],
  author: string,
  content: string
): Promise<Comment | null> {
  try {
    const comment = await prisma.comment.create({
      data: {
        page,
        author,
        content,
      },
    })

    return {
      id: comment.id,
      page: comment.page as Comment['page'],
      author: comment.author,
      content: comment.content,
      timestamp: comment.createdAt,
    }
  } catch (error) {
    console.error('Error adding comment:', error)
    return null
  }
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

export const calculateNationalSummary = (reports: ChurchReport[]) => {
  const totalRevenue = reports.reduce((sum, r) => sum + calculateTotalRevenue(r), 0)
  const totalExpense = reports.reduce((sum, r) => sum + calculateTotalExpense(r), 0)
  const balance = totalRevenue - totalExpense

  return {
    totalChurches: reports.length,
    totalRevenue,
    totalExpense,
    balance,
  }
}

export const getRevenueByRegion = (reports: ChurchReport[]) => {
  const regionMap = new Map<string, number>()

  reports.forEach((report) => {
    const revenue = calculateTotalRevenue(report)
    const current = regionMap.get(report.region) || 0
    regionMap.set(report.region, current + revenue)
  })

  return Array.from(regionMap.entries()).map(([name, value]) => ({
    name,
    value,
  }))
}

export const getChartData = (reports: ChurchReport[]) => {
  return reports.map((report) => ({
    name: report.churchName.replace('Igreja ', ''),
    revenue: calculateTotalRevenue(report),
    expense: calculateTotalExpense(report),
  }))
}

// ============================================
// DUMMY DATA (for seeding)
// ============================================

export const dummyReports: ChurchReport[] = [
  {
    id: 'report-001',
    churchName: 'Igreja Baucau Centro',
    region: 'Baucau',
    month: 'Junhu',
    year: 2024,
    osanTama: [
      { id: 'ot-1', deskrisaun: 'Persembahan Minggu', montante: 2500.0 },
      { id: 'ot-2', deskrisaun: 'Perpuluhan', montante: 3200.0 },
      { id: 'ot-3', deskrisaun: 'Donasaun Kaeruk', montante: 800.0 },
    ],
    gastu: [
      { id: 'g-1', gastuBaSaida: 'Lista Kirista', montante: 800.0 },
      { id: 'g-2', gastuBaSaida: 'Materia Construsaun', montante: 500.0 },
      { id: 'g-3', gastuBaSaida: 'Programa Juventude', montante: 400.0 },
    ],
  },
  {
    id: 'report-002',
    churchName: 'Igreja Lospalos',
    region: 'Lospalos',
    month: 'Junhu',
    year: 2024,
    osanTama: [
      { id: 'ot-4', deskrisaun: 'Persembahan Minggu', montante: 1800.0 },
      { id: 'ot-5', deskrisaun: 'Perpuluhan', montante: 2400.0 },
    ],
    gastu: [
      { id: 'g-4', gastuBaSaida: 'Operasional Gereja', montante: 900.0 },
      { id: 'g-5', gastuBaSaida: 'Reparasaun Tela', montante: 350.0 },
    ],
  },
  {
    id: 'report-003',
    churchName: 'Igreja Viqueque Centro',
    region: 'Viqueque',
    month: 'Junhu',
    year: 2024,
    osanTama: [
      { id: 'ot-6', deskrisaun: 'Persembahan', montante: 1200.0 },
      { id: 'ot-7', deskrisaun: 'Perpuluhan', montante: 1500.0 },
      { id: 'ot-8', deskrisaun: 'Donasaun Spesial', montante: 300.0 },
    ],
    gastu: [
      { id: 'g-6', gastuBaSaida: 'Gastu Listrik', montante: 250.0 },
      { id: 'g-7', gastuBaSaida: 'Buku Sekola Domingo', montante: 300.0 },
    ],
  },
  {
    id: 'report-004',
    churchName: 'Igreja Manatuto',
    region: 'Manatuto',
    month: 'Junhu',
    year: 2024,
    osanTama: [
      { id: 'ot-9', deskrisaun: 'Persembahan Minggu', montante: 1500.0 },
      { id: 'ot-10', deskrisaun: 'Perpuluhan', montante: 2000.0 },
    ],
    gastu: [
      { id: 'g-8', gastuBaSaida: 'Gastu Air', montante: 200.0 },
      { id: 'g-9', gastuBaSaida: 'Pemeliharaan Gedung', montante: 450.0 },
    ],
  },
  {
    id: 'report-005',
    churchName: 'Igreja Baucau Leste',
    region: 'Baucau',
    month: 'Meiu',
    year: 2024,
    osanTama: [
      { id: 'ot-11', deskrisaun: 'Persembahan', montante: 900.0 },
      { id: 'ot-12', deskrisaun: 'Perpuluhan', montante: 1100.0 },
    ],
    gastu: [
      { id: 'g-10', gastuBaSaida: 'Kontrak Pastor', montante: 500.0 },
    ],
  },
  {
    id: 'report-006',
    churchName: 'Igreja Lospalos Utara',
    region: 'Lospalos',
    month: 'Meiu',
    year: 2024,
    osanTama: [
      { id: 'ot-13', deskrisaun: 'Persembahan Minggu', montante: 1100.0 },
      { id: 'ot-14', deskrisaun: 'Donasaun', montante: 350.0 },
    ],
    gastu: [
      { id: 'g-11', gastuBaSaida: 'Gastu Operasional', montante: 600.0 },
      { id: 'g-12', gastuBaSaida: 'Alat Muzik', montante: 350.0 },
    ],
  },
  {
    id: 'report-007',
    churchName: 'Igreja Viqueque Sul',
    region: 'Viqueque',
    month: 'Meiu',
    year: 2024,
    osanTama: [
      { id: 'ot-15', deskrisaun: 'Persembahan', montante: 800.0 },
      { id: 'ot-16', deskrisaun: 'Perpuluhan', montante: 950.0 },
    ],
    gastu: [
      { id: 'g-13', gastuBaSaida: 'Programa Anak', montante: 180.0 },
      { id: 'g-14', gastuBaSaida: 'Gastu Transports', montante: 120.0 },
    ],
  },
  {
    id: 'report-008',
    churchName: 'Igreja Manatuto Timur',
    region: 'Manatuto',
    month: 'Meiu',
    year: 2024,
    osanTama: [
      { id: 'ot-17', deskrisaun: 'Persembahan Spesial', montante: 700.0 },
      { id: 'ot-18', deskrisaun: 'Perpuluhan', montante: 850.0 },
    ],
    gastu: [
      { id: 'g-15', gastuBaSaida: 'Gastu Listrik', montante: 180.0 },
      { id: 'g-16', gastuBaSaida: 'Kontrak Penjaga', montante: 200.0 },
    ],
  },
  {
    id: 'report-009',
    churchName: 'Igreja Baucau Oeste',
    region: 'Baucau',
    month: 'Abril',
    year: 2024,
    osanTama: [
      { id: 'ot-19', deskrisaun: 'Persembahan Paskah', montante: 1600.0 },
      { id: 'ot-20', deskrisaun: 'Perpuluhan', montante: 750.0 },
    ],
    gastu: [
      { id: 'g-17', gastuBaSaida: 'Dekorasi Paskah', montante: 320.0 },
      { id: 'g-18', gastuBaSaida: 'Gastu Makan', montante: 280.0 },
    ],
  },
  {
    id: 'report-010',
    churchName: 'Igreja Lospalos Selatan',
    region: 'Lospalos',
    month: 'Abril',
    year: 2024,
    osanTama: [
      { id: 'ot-21', deskrisaun: 'Persembahan', montante: 650.0 },
      { id: 'ot-22', deskrisaun: 'Donasaun Anggota', montante: 400.0 },
    ],
    gastu: [
      { id: 'g-19', gastuBaSaida: 'Gastu Umum', montante: 350.0 },
      { id: 'g-20', gastuBaSaida: 'Sosialisasi', montante: 150.0 },
    ],
  },
]

// Seed database with dummy data
export async function seedDatabase(): Promise<void> {
  try {
    const existingReports = await prisma.churchReport.count()
    
    if (existingReports === 0) {
      console.log('Seeding database with dummy data...')
      
      for (const report of dummyReports) {
        await prisma.churchReport.create({
          data: {
            churchName: report.churchName,
            region: report.region,
            month: report.month,
            year: report.year,
            osanTama: {
              create: report.osanTama.map((ot) => ({
                deskrisaun: ot.deskrisaun,
                montante: ot.montante,
              })),
            },
            gastu: {
              create: report.gastu.map((g) => ({
                gastuBaSaida: g.gastuBaSaida,
                montante: g.montante,
              })),
            },
          },
        })
      }
      
      // Add sample comments
      await prisma.comment.createMany({
        data: [
          {
            page: 'landing',
            author: 'Pastor João',
            content: "Sistema ida ne'e diak tebes! Obrigadu.",
          },
          {
            page: 'nasional',
            author: 'Admin Geral',
            content: 'Relatóriu husi Baucau tama ona. Diak!',
          },
        ],
      })
      
      console.log('Reports seeded successfully!')
    }

    // Seed demo admin users with QR codes
    const existingUsers = await prisma.user.count()
    if (existingUsers === 0) {
      console.log('Seeding demo admin users...')

      // Create demo ADMIN_REGIONAL
      const regionalAdmin = await prisma.user.create({
        data: {
          name: 'Pastor Francisco Baucau',
          role: 'ADMIN_REGIONAL',
          region: 'Baucau',
          status: 'ACTIVE',
          qrCodes: {
            create: [{
              token: 'demo-regional-token-' + Date.now(),
              isActive: true,
            }],
          },
        },
      })

      // Create demo ADMIN_LOKAL
      const lokalAdmin = await prisma.user.create({
        data: {
          name: 'Diakonu Pedro Lospalos',
          role: 'ADMIN_LOKAL',
          churchName: 'Igreja Lospalos Centro',
          status: 'ACTIVE',
          qrCodes: {
            create: [{
              token: 'demo-lokal-token-' + Date.now(),
              isActive: true,
            }],
          },
        },
      })

      // Add login history entries
      await prisma.loginHistory.createMany({
        data: [
          {
            userId: regionalAdmin.id,
            method: 'QR_CODE',
            deviceInfo: 'Chrome / Windows',
            ipAddress: '192.168.1.1',
          },
          {
            userId: lokalAdmin.id,
            method: 'QR_CODE',
            deviceInfo: 'Safari / iPhone',
            ipAddress: '192.168.1.2',
          },
        ],
      })

      console.log('Demo admin users seeded successfully!')
      console.log('========================================')
      console.log('Demo admins created with QR codes.')
      console.log('To get QR tokens for testing, login as Super Admin')
      console.log('and generate new QR codes from /admin/manage')
      console.log('========================================')
    }
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}
