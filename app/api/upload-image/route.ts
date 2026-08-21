import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed in production', { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    
    // Upload the file directly to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image', details: error.message }, { status: 500 })
  }
}
