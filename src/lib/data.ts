// TypeScript Interface for Church Report
export interface ChurchReport {
  id: string
  churchName: string
  region: string
  month: string
  year: number

  // Revenue fields
  persembahan: number
  perpuluhan: number
  donasaun: number
  osanTamaSeluk: number

  // Expense fields
  operasional: number
  manutensaun: number
  programaMinisteriu: number
  gastuSeluk: number
}

// Regions in Timor-Leste
export const REGIONS = [
  'Dili',
  'Baucau',
  'Same',
  'Liquiça',
  'Maliana',
  'Suai',
  'Aileu',
  'Manatuto',
  'Oecusse',
  'Viqueque',
  'Ermera',
  'Ainaro',
  'Lautém',
  'Bobonaro',
  'Cova Lima',
  'Manufahi',
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

// Generate unique ID
export const generateId = (): string => {
  return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Calculate total revenue
export const calculateTotalRevenue = (report: Partial<ChurchReport>): number => {
  return (
    (report.persembahan || 0) +
    (report.perpuluhan || 0) +
    (report.donasaun || 0) +
    (report.osanTamaSeluk || 0)
  )
}

// Calculate total expenses
export const calculateTotalExpense = (report: Partial<ChurchReport>): number => {
  return (
    (report.operasional || 0) +
    (report.manutensaun || 0) +
    (report.programaMinisteriu || 0) +
    (report.gastuSeluk || 0)
  )
}

// Calculate balance
export const calculateBalance = (report: Partial<ChurchReport>): number => {
  return calculateTotalRevenue(report) - calculateTotalExpense(report)
}

// Format number as USD
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Dummy data for 10 churches
export const dummyReports: ChurchReport[] = [
  {
    id: 'report-001',
    churchName: 'Igreja Dili Centro',
    region: 'Dili',
    month: 'Junhu',
    year: 2024,
    persembahan: 2500.0,
    perpuluhan: 3200.0,
    donasaun: 800.0,
    osanTamaSeluk: 150.0,
    operasional: 1200.0,
    manutensaun: 500.0,
    programaMinisteriu: 600.0,
    gastuSeluk: 200.0,
  },
  {
    id: 'report-002',
    churchName: 'Igreja Baucau',
    region: 'Baucau',
    month: 'Junhu',
    year: 2024,
    persembahan: 1800.0,
    perpuluhan: 2400.0,
    donasaun: 500.0,
    osanTamaSeluk: 100.0,
    operasional: 900.0,
    manutensaun: 350.0,
    programaMinisteriu: 400.0,
    gastuSeluk: 150.0,
  },
  {
    id: 'report-003',
    churchName: 'Igreja Same',
    region: 'Same',
    month: 'Junhu',
    year: 2024,
    persembahan: 1200.0,
    perpuluhan: 1500.0,
    donasaun: 300.0,
    osanTamaSeluk: 80.0,
    operasional: 650.0,
    manutensaun: 200.0,
    programaMinisteriu: 300.0,
    gastuSeluk: 100.0,
  },
  {
    id: 'report-004',
    churchName: 'Igreja Liquiça',
    region: 'Liquiça',
    month: 'Junhu',
    year: 2024,
    persembahan: 1500.0,
    perpuluhan: 2000.0,
    donasaun: 450.0,
    osanTamaSeluk: 120.0,
    operasional: 800.0,
    manutensaun: 300.0,
    programaMinisteriu: 450.0,
    gastuSeluk: 120.0,
  },
  {
    id: 'report-005',
    churchName: 'Igreja Maliana',
    region: 'Maliana',
    month: 'Junhu',
    year: 2024,
    persembahan: 900.0,
    perpuluhan: 1100.0,
    donasaun: 250.0,
    osanTamaSeluk: 60.0,
    operasional: 500.0,
    manutensaun: 180.0,
    programaMinisteriu: 220.0,
    gastuSeluk: 80.0,
  },
  {
    id: 'report-006',
    churchName: 'Igreja Suai',
    region: 'Suai',
    month: 'Junhu',
    year: 2024,
    persembahan: 1100.0,
    perpuluhan: 1400.0,
    donasaun: 350.0,
    osanTamaSeluk: 90.0,
    operasional: 600.0,
    manutensaun: 250.0,
    programaMinisteriu: 350.0,
    gastuSeluk: 110.0,
  },
  {
    id: 'report-007',
    churchName: 'Igreja Aileu',
    region: 'Aileu',
    month: 'Junhu',
    year: 2024,
    persembahan: 800.0,
    perpuluhan: 950.0,
    donasaun: 200.0,
    osanTamaSeluk: 50.0,
    operasional: 420.0,
    manutensaun: 150.0,
    programaMinisteriu: 180.0,
    gastuSeluk: 70.0,
  },
  {
    id: 'report-008',
    churchName: 'Igreja Manatuto',
    region: 'Manatuto',
    month: 'Junhu',
    year: 2024,
    persembahan: 700.0,
    perpuluhan: 850.0,
    donasaun: 180.0,
    osanTamaSeluk: 40.0,
    operasional: 380.0,
    manutensaun: 130.0,
    programaMinisteriu: 160.0,
    gastuSeluk: 60.0,
  },
  {
    id: 'report-009',
    churchName: 'Igreja Oecusse',
    region: 'Oecusse',
    month: 'Junhu',
    year: 2024,
    persembahan: 600.0,
    perpuluhan: 750.0,
    donasaun: 150.0,
    osanTamaSeluk: 35.0,
    operasional: 320.0,
    manutensaun: 110.0,
    programaMinisteriu: 140.0,
    gastuSeluk: 50.0,
  },
  {
    id: 'report-010',
    churchName: 'Igreja Viqueque',
    region: 'Viqueque',
    month: 'Junhu',
    year: 2024,
    persembahan: 650.0,
    perpuluhan: 800.0,
    donasaun: 160.0,
    osanTamaSeluk: 45.0,
    operasional: 350.0,
    manutensaun: 120.0,
    programaMinisteriu: 150.0,
    gastuSeluk: 55.0,
  },
]

// Calculate national summary
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

// Get revenue by region for pie chart
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

// Get chart data for reports
export const getChartData = (reports: ChurchReport[]) => {
  return reports.map((report) => ({
    name: report.churchName.replace('Igreja ', ''),
    revenue: calculateTotalRevenue(report),
    expense: calculateTotalExpense(report),
    persembahan: report.persembahan,
    perpuluhan: report.perpuluhan,
    donasaun: report.donasaun,
  }))
}
