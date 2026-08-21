import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import fs from 'fs/promises'
import path from 'path'

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

    // Create the dilemmas table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS dilemmas (
        id VARCHAR(255) PRIMARY KEY,
        statement TEXT NOT NULL,
        image TEXT NOT NULL,
        severity INTEGER NOT NULL,
        attributes JSONB NOT NULL
      )
    `

    // Read local dilemmas.json
    const jsonPath = path.join(process.cwd(), 'data/dilemmas.json')
    const fileContent = await fs.readFile(jsonPath, 'utf-8')
    const localCards = JSON.parse(fileContent)

    let insertedCount = 0

    // Insert all local cards into Neon Postgres database
    for (const card of localCards) {
      await sql`
        INSERT INTO dilemmas (id, statement, image, severity, attributes)
        VALUES (${card.id}, ${card.statement}, ${card.image}, ${card.severity}, ${JSON.stringify(card.attributes || [])})
        ON CONFLICT (id) DO UPDATE 
        SET statement = EXCLUDED.statement,
            image = EXCLUDED.image,
            severity = EXCLUDED.severity,
            attributes = EXCLUDED.attributes
      `
      insertedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Table verified and ${insertedCount} cards processed successfully!`,
    })
  } catch (error: any) {
    console.error('Migration setup failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
