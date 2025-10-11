import { NextResponse } from 'next/server'
import { getAlertSummary, getItemsWithLowStock } from '@/lib/alerts'

/**
 * GET /api/alerts
 * Fetch all low stock items with alert summary
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'summary'

    if (format === 'summary') {
      const summary = await getAlertSummary()
      return NextResponse.json({
        success: true,
        data: summary,
      })
    } else {
      const items = await getItemsWithLowStock()
      return NextResponse.json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      })
    }
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
      },
      { status: 500 }
    )
  }
}
