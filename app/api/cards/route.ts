import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const JSON_FILE = path.join(process.cwd(), 'data/dilemmas.json')

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  try {
    const fileContent = await fs.readFile(JSON_FILE, 'utf-8')
    const cards = JSON.parse(fileContent)
    return NextResponse.json(cards)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  try {
    const { cards } = await request.json()
    await fs.writeFile(JSON_FILE, JSON.stringify(cards, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating dilemmas JSON:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
