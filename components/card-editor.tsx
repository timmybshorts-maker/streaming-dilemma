'use client'

import { useEffect, useState } from 'react'

type Card = {
  id: string
  statement: string
  image: string
  severity: number
  attributes: string[]
}

type Props = {
  cards: Card[]
  onRefresh: () => void
}

export default function CardEditor({ cards, onRefresh }: Props) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const empty: Card = { id: '', statement: '', image: '', severity: 5, attributes: ['', '', ''] }
  const [editing, setEditing] = useState<Card>(empty)
  const [isNew, setIsNew] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string; name: string }[]>([])

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setEditing((s) => ({ ...s, image: data.url }))
        setUploadedImages((u) => [{ id: Date.now().toString(), url: data.url, name: file.name }, ...u])
      }
    } catch (err) {
      console.error('Upload failed', err)
      alert('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const found = uploadedImages.find((u) => u.id === id)
    if (found) setEditing((s) => ({ ...s, image: found.url }))
  }

  useEffect(() => {
    if (cards.length && editing.id === '') {
      setEditing(cards[0])
      setIsNew(false)
    }
  }, [cards])

  function startNew() {
    setEditing({ ...empty, id: Date.now().toString() })
    setIsNew(true)
  }

  async function save() {
    if (!editing.id) editing.id = Date.now().toString()
    const savedAttributes = [
      editing.attributes?.[0] || '',
      editing.attributes?.[1] || '',
      editing.attributes?.[2] || '',
    ]
    const updatedCard = { ...editing, attributes: savedAttributes }
    
    let newCards: Card[]
    if (isNew) {
      newCards = [updatedCard, ...cards]
    } else {
      newCards = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    }

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: newCards }),
      })
      if (res.ok) {
        onRefresh()
        setIsNew(false)
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (err) {
      console.error('Save failed', err)
      alert('Fehler beim Speichern')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Wirklich löschen?')) return
    const newCards = cards.filter((c) => c.id !== id)
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: newCards }),
      })
      if (res.ok) {
        onRefresh()
        if (editing.id === id) {
          setEditing(empty)
          setIsNew(true)
        }
      } else {
        alert('Fehler beim Löschen')
      }
    } catch (err) {
      console.error('Delete failed', err)
      alert('Fehler beim Löschen')
    }
  }

  return (
    <section className="mb-6 rounded-lg border-2 border-[var(--color-gold)] bg-secondary/10 p-4 gold-frame">
      <div className="flex items-center justify-between">
        <h3 className="mb-3 text-sm font-bold ornament-top">Karten-Pool (API)</h3>
        <div className="flex gap-2">
          <button onClick={startNew} className="medieval-button text-xs">✨ Neue Karte ✨</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="col-span-1 max-h-[500px] overflow-auto">
          <ul className="space-y-2">
            {cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md border-2 border-[var(--color-bronze)] p-2 gold-frame bg-card/50">
                <button className="text-left" onClick={() => { setEditing(c); setIsNew(false) }}>
                  <div className="font-bold text-sm">{c.statement.slice(0, 40) || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground">Schwere: {c.severity}</div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-destructive hover:text-destructive/70 transition-colors">🗑️ Löschen</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-mono">Text</label>
          <textarea value={editing.statement} onChange={(e) => setEditing({ ...editing, statement: e.target.value })} className="mt-1 w-full rounded-md p-2" />

          <label className="mt-2 block text-xs font-mono">Bild (Datei oder URL)</label>
          <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="mt-1 w-full rounded-md px-2 py-1" placeholder="https://... or local file" />
          <input type="file" accept="image/*" onChange={handleFile} className="mt-2 block text-xs" disabled={uploading} />
          <div className="mt-3">
            <label className="block text-xs font-mono">Oder: Bild per Drag & Drop hierher ziehen</label>
            <div onDrop={handleDrop} onDragOver={handleDragOver} className={`mt-2 flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed border-border bg-background/30 text-sm text-muted-foreground ${uploading ? 'opacity-50' : ''}`}>
              {uploading ? 'Wird hochgeladen...' : 'Drop hierher'}
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-mono">Ausgewählte lokale Bilder</label>
            <select onChange={handleSelectChange} className="mt-1 w-full rounded-md px-2 py-1">
              <option value="">-- keine --</option>
              {uploadedImages.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {editing.image && (
            <div className="mt-2 flex items-center gap-2">
              <img src={editing.image} alt="preview" className="h-20 w-32 rounded-md object-cover border" />
              <button type="button" onClick={() => setEditing({ ...editing, image: '' })} className="text-xs text-destructive">Bild entfernen</button>
            </div>
          )}

          <label className="mt-2 block text-xs font-mono">Schwere (1-10)</label>
          <input type="range" min={1} max={10} value={editing.severity} onChange={(e) => setEditing({ ...editing, severity: Number(e.target.value) })} className="w-full" />

          <label className="mt-2 block text-xs font-mono">Attribute (3)</label>
          <div className="grid gap-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                value={editing.attributes?.[i] || ''}
                onChange={(e) => {
                  const a = [...(editing.attributes || ['', '', ''])]
                  a[i] = e.target.value
                  setEditing({ ...editing, attributes: a })
                }}
                className="rounded-md px-2 py-1"
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button onClick={save} className="medieval-button">💾 Speichern</button>
          </div>
        </div>
      </div>
    </section>
  )
}
