import { NextRequest, NextResponse } from 'next/server'
import { getAllReports, createReport } from '@/lib/data'

// GET /api/reports - Get all reports
export async function GET() {
  try {
    const reports = await getAllReports()
    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { churchName, region, month, year, osanTama, gastu } = body

    // Validate required fields
    if (!churchName || !region || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const report = await createReport({
      churchName,
      region,
      month,
      year: parseInt(year),
      osanTama: osanTama || [],
      gastu: gastu || [],
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
