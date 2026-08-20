import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const JSON_FILE = path.join(process.cwd(), 'data/dilemmas.json')

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  try {
    const { cards } = await request.json()
    
    // We need to transform the flat cards back into dilemmas (pairs)
    const dilemmas: any[] = []
    for (let i = 0; i < cards.length; i += 2) {
      const cardA = cards[i]
      const cardB = cards[i+1]
      if (!cardA || !cardB) continue
      
      dilemmas.push({
        id: Math.floor(i / 2) + 1,
        a: {
          label: 'Option A',
          statement: cardA.statement,
          image: cardA.image,
          attributes: cardA.attributes || []
        },
        b: {
          label: 'Option B',
          statement: cardB.statement,
          image: cardB.image,
          attributes: cardB.attributes || []
        }
      })
    }
    
    await fs.writeFile(JSON_FILE, JSON.stringify(dilemmas, null, 2), 'utf-8')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating dilemmas JSON:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
