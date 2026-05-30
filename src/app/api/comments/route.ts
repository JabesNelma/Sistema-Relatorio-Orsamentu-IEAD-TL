import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByPage, addComment } from '@/lib/data'

// GET /api/comments - Get comments by page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') as 'landing' | 'regional' | 'nasional' | null

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page parameter is required' },
        { status: 400 }
      )
    }

    const comments = await getCommentsByPage(page)
    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/comments - Add a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, author, content } = body

    // Validate required fields
    if (!page || !author || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate page value
    const validPages = ['landing', 'regional', 'nasional']
    if (!validPages.includes(page)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page value' },
        { status: 400 }
      )
    }

    const comment = await addComment(page, author, content)

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Failed to add comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: comment })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
