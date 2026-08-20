'use client'

import { useEffect, useRef, useState } from 'react'
import { Settings, Volume2, VolumeX, Music, Trees } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AudioController() {
  const [isOpen, setIsOpen] = useState(false)
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [ambientVolume, setAmbientVolume] = useState(0.2)
  const [selectedSong, setSelectedSong] = useState<'lugenlord' | 'etzala'>('lugenlord')
  
  const lugenlordRef = useRef<HTMLVideoElement>(null)
  const etzalaRef = useRef<HTMLAudioElement>(null)
  const ambientRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const savedMusicVol = localStorage.getItem('audio-music-volume')
    const savedAmbientVol = localStorage.getItem('audio-ambient-volume')
    if (savedMusicVol !== null) setMusicVolume(parseFloat(savedMusicVol))
    if (savedAmbientVol !== null) setAmbientVolume(parseFloat(savedAmbientVol))
  }, [])

  useEffect(() => {
    if (lugenlordRef.current) {
      lugenlordRef.current.volume = selectedSong === 'lugenlord' ? musicVolume : 0
    }
    if (etzalaRef.current) {
      etzalaRef.current.volume = selectedSong === 'etzala' ? musicVolume : 0
    }
    localStorage.setItem('audio-music-volume', musicVolume.toString())
  }, [musicVolume, selectedSong])

  useEffect(() => {
    if (ambientRef.current) ambientRef.current.volume = ambientVolume
    localStorage.setItem('audio-ambient-volume', ambientVolume.toString())
  }, [ambientVolume])

  // Browser policy: audio often needs user interaction to start
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (!hasInteracted) return

    if (selectedSong === 'lugenlord') {
      if (etzalaRef.current) {
        etzalaRef.current.pause()
        etzalaRef.current.currentTime = 0
      }
      if (lugenlordRef.current) {
        lugenlordRef.current.play().catch(console.error)
      }
    } else {
      if (lugenlordRef.current) {
        lugenlordRef.current.pause()
        lugenlordRef.current.currentTime = 0
      }
      if (etzalaRef.current) {
        etzalaRef.current.play().catch(console.error)
      }
    }
  }, [selectedSong, hasInteracted])

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true)
      if (selectedSong === 'lugenlord') {
        if (lugenlordRef.current) lugenlordRef.current.play().catch(console.error)
      } else {
        if (etzalaRef.current) etzalaRef.current.play().catch(console.error)
      }
      if (ambientRef.current) ambientRef.current.play().catch(console.error)
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [selectedSong])

  return (
    <>
      {/* Hidden Audio Elements */}
      <video
        ref={lugenlordRef}
        src="/lügenlord cropped.mov"
        loop
        autoPlay={hasInteracted && selectedSong === 'lugenlord'}
        playsInline
        className="hidden"
      />
      <audio
        ref={etzalaRef}
        src="/etzela_song.wav"
        loop
        autoPlay={hasInteracted && selectedSong === 'etzala'}
      />
      {/* forest short.mov is a video file, using video tag but keeping it hidden */}
      <video
        ref={ambientRef}
        src="/forest short.mov"
        loop
        autoPlay={hasInteracted}
        playsInline
        className="hidden"
      />

      {/* Toggle Button */}
      <div className="fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-full bg-stone-900/80 border-2 border-[var(--color-gold)] text-[var(--color-gold)] shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-110 transition-all duration-200 backdrop-blur-md"
          aria-label="Audio Einstellungen"
        >
          <Settings className={cn("size-6 transition-transform duration-500", isOpen && "rotate-90")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
              className="absolute top-16 left-0 w-64 bg-stone-950/90 border-2 border-[var(--color-gold)] rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] gold-frame z-[70]"
            >
              <h3 className="font-medieval text-sm uppercase tracking-widest text-[var(--color-gold)] mb-6 text-center border-b border-[var(--color-gold)]/30 pb-2">
                Audio-Steuerung
              </h3>

              <div className="space-y-6">
                {/* Music Dropdown Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-tighter text-[var(--color-gold)]/80">
                    Hintergrundmusik
                  </label>
                  <select
                    value={selectedSong}
                    onChange={(e) => setSelectedSong(e.target.value as 'lugenlord' | 'etzala')}
                    className="w-full bg-stone-900 border border-[var(--color-gold)]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] cursor-pointer"
                  >
                    <option value="lugenlord">Lügenlord</option>
                    <option value="etzala">Etzala Song</option>
                  </select>
                </div>

                {/* Music Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[var(--color-gold)]/80">
                    <div className="flex items-center gap-2">
                      <Music className="size-4" />
                      <span className="text-xs font-mono uppercase tracking-tighter">
                        {selectedSong === 'lugenlord' ? 'Lügenlord' : 'Etzala Song'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]"
                  />
                </div>

                {/* Ambient Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[var(--color-gold)]/80">
                    <div className="flex items-center gap-2">
                      <Trees className="size-4" />
                      <span className="text-xs font-mono uppercase tracking-tighter">Waldgeräusche</span>
                    </div>
                    <span className="text-[10px] font-mono">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]"
                  />
                </div>
              </div>

              {!hasInteracted && (
                <p className="mt-6 text-[10px] text-center text-stone-400 italic leading-tight">
                  Klicke irgendwo auf die Seite, um das Audio zu aktivieren.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
