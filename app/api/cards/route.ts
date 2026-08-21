import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL env variable is missing' }, { status: 500 })
  }

  try {
    const sql = neon(databaseUrl)
    const result = await sql`
      SELECT id, statement, image, severity, attributes
      FROM dilemmas
      ORDER BY id DESC
    `

    // Map attributes back from JSON if necessary, though neon already returns them parsed if they are JSONB
    const cards = result.map((row: any) => ({
      id: row.id,
      statement: row.statement,
      image: row.image,
      severity: row.severity,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
    }))

    return NextResponse.json(cards)
  } catch (error: any) {
    console.error('Error fetching cards from Neon DB:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL env variable is missing' }, { status: 500 })
  }

  try {
    const { cards } = await request.json()
    const sql = neon(databaseUrl)

    // First delete all existing dilemmas to match what was previously an overwrite of dilemmas.json
    await sql`DELETE FROM dilemmas`

    // Re-insert the updated array of cards
    for (const card of cards) {
      await sql`
        INSERT INTO dilemmas (id, statement, image, severity, attributes)
        VALUES (${card.id}, ${card.statement}, ${card.image}, ${card.severity}, ${JSON.stringify(card.attributes || [])})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating dilemmas in Neon DB:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
