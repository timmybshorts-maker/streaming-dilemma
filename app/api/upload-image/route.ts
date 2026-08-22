import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
    
    // If BLOB_READ_WRITE_TOKEN is configured, try uploading directly to Vercel Blob first
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(filename, file, {
          access: 'public',
        })
        if (blob && blob.url) {
          return NextResponse.json({ url: blob.url })
        }
      } catch (blobError: any) {
        console.warn('Vercel Blob upload failed, falling back to local file storage:', blobError.message)
      }
    }

    // Local upload fallback: write the file to the local 'public/uploads' directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const path = join(uploadDir, filename)
    await writeFile(path, buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image', details: error.message }, { status: 500 })
  }
}
