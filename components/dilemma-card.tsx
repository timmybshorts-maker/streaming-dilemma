'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Option } from '@/lib/dilemmas'
import { cn } from '@/lib/utils'

type Side = 'a' | 'b'

type DilemmaCardProps = {
  option: Option
  side: Side
  onChoose: () => void
  disabled: boolean
}

const sideConfig = {
  a: {
    rank: 'A',
    emoji: '⚔️',
    text: 'text-team-red',
    glow: 'text-glow-red',
    frame: 'hs-card',
    cardBg: 'bg-stone-950 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-950/60',
    borderGlow: 'border-[#7a3a2e]/40 shadow-[0_0_20px_-5px_rgba(122,58,46,0.5)]',
    hover: 'hover:shadow-[0_0_40px_-10px_rgba(122,58,46,0.6)]',
    button: 'bg-gradient-to-b from-[#5a1a1a] to-[#3a0a0a] border-[#8c6d4f] text-stone-200 shadow-[0_4px_0_#1a0500] active:translate-y-[2px] active:shadow-[0_2px_0_#1a0500] hover:from-[#6a2a2a] hover:to-[#4a1a1a]',
  },
  b: {
    rank: 'B',
    emoji: '🛡️',
    text: 'text-team-blue',
    glow: 'text-glow-blue',
    frame: 'hs-card',
    cardBg: 'bg-stone-950 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-950/60',
    borderGlow: 'border-[#1a2a4a]/40 shadow-[0_0_20px_-5px_rgba(26,42,74,0.5)]',
    hover: 'hover:shadow-[0_0_40px_-10px_rgba(26,42,74,0.6)]',
    button: 'bg-gradient-to-b from-[#1a2a4a] to-[#0a103a] border-[#8c6d4f] text-stone-200 shadow-[0_4px_0_#00051a] active:translate-y-[2px] active:shadow-[0_2px_0_#00051a] hover:from-[#2a3a5a] hover:to-[#1a204a]',
  },
} as const

// SVG Celtic Knot / Ornate corner bracket
const CelticCorner = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const rotationClass = {
    'top-left': 'top-2.5 left-2.5 rotate-0',
    'top-right': 'top-2.5 right-2.5 rotate-90',
    'bottom-left': 'bottom-2.5 left-2.5 -rotate-90',
    'bottom-right': 'bottom-2.5 right-2.5 rotate-180',
  }[position]

  return (
    <svg
      className={cn('absolute size-9 text-[var(--color-gold)]/40 pointer-events-none z-10', rotationClass)}
      viewBox="0 0 100 100"
      fill="currentColor"
    >
      {/* Intricate Celtic style ornament */}
      <path d="M 0,0 C 20,0 35,5 50,15 C 60,25 65,35 65,50 L 50,50 C 50,40 45,35 38,30 C 30,25 20,20 0,20 L 0,0 Z" />
      <path d="M 0,35 C 15,35 25,40 30,45 L 20,55 C 15,50 10,48 0,48 L 0,35 Z" opacity="0.8" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="8" cy="40" r="3" />
      <circle cx="40" cy="8" r="3" />
    </svg>
  )
}

export function DilemmaCard({ option, side, onChoose, disabled }: DilemmaCardProps) {
  const cfg = sideConfig[side]

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotateX: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ perspective: 1000 }}
      className="flex h-full w-full max-w-[26rem] md:max-w-[28rem] mx-auto flex-col"
    >
      <motion.div
        whileHover={disabled ? undefined : { y: -10, scale: 1.02, rotate: side === 'a' ? -1.5 : 1.5 }}
        transition={{ duration: 0 }}
        className={cn(
          'group relative flex h-full flex-1 flex-col rounded-[2rem] border-[6px] border-[#6b4500]/40 p-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.8)]',
          cfg.cardBg,
          cfg.borderGlow,
          cfg.hover
        )}
      >
        {/* Corner Ornaments */}
        <CelticCorner position="top-left" />
        <CelticCorner position="top-right" />
        <CelticCorner position="bottom-left" />
        <CelticCorner position="bottom-right" />

        {/* Triple inner detailed gold/bronze gothic style layout borders */}
        <div className="absolute inset-1 rounded-[1.8rem] border-2 border-dashed border-[var(--color-gold)]/40 pointer-events-none" />
        <div className="absolute inset-2.5 rounded-[1.6rem] border border-[var(--color-gold)]/15 pointer-events-none" />
        <div className="absolute inset-4 rounded-[1.4rem] border-2 border-double border-[var(--color-gold)]/10 pointer-events-none" />

        {/* Seal Badge in top-left */}
        <div className={cn(
          'absolute top-2 left-2 z-30 size-11 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[#8b6508] border-2 border-white/40 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105',
          cfg.glow
        )}>
          <span className="font-medieval text-lg font-bold text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">{cfg.rank}</span>
        </div>

        {/* Arched Picture Frame (artwork) with medieval stone-carved look */}
        <div className="relative mx-auto mt-5 w-[94%] aspect-[4/3] rounded-t-[4.5rem] overflow-hidden border-[5px] border-double border-[var(--color-gold)] bg-black shadow-[inset_0_4px_25px_rgba(0,0,0,0.95),0_8px_20px_rgba(0,0,0,0.7)] shrink-0">
          <Image
            src={option.image || '/placeholder.svg'}
            alt={option.statement}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Center Golden Separator Shield */}
        <div className="relative flex items-center justify-center -my-3.5 z-10 w-[94%] mx-auto">
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
          <div className="absolute bg-gradient-to-br from-[var(--color-gold)] to-[#8b6508] border-2 border-white/30 size-8 rotate-45 flex items-center justify-center shadow-md">
            <span className="text-[13px] text-black font-bold -rotate-45 leading-none">{cfg.emoji}</span>
          </div>
        </div>

        {/* Parchment Text Box & Choosing Control - Styled with calligraphic, medieval flair */}
        <div className="flex-1 flex flex-col justify-between mx-auto mt-5 mb-2 w-[94%] bg-gradient-to-b from-[#fdf6e2] via-[#f5e6d3] to-[#dfcfb7] border-[3px] border-[#8c6d4f] shadow-[inset_0_0_20px_rgba(90,60,30,0.5),0_10px_20px_rgba(0,0,0,0.5)] rounded-b-2xl p-4 text-[#2b1704] z-10 relative">
          {/* Subtle medieval parchment texture overlay */}
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-b-xl" />
          
          <div className="flex flex-1 items-center justify-center py-2 min-h-[6.5rem] relative z-10">
            <p className="text-balance text-center text-xl md:text-2xl font-black leading-tight font-serif text-[#321a04] drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              {option.statement}
            </p>
          </div>

          {/* 3 attributes on card parchment with elegant gold border style */}
          <div className="mt-3 pt-3 border-t-2 border-double border-[#8c6d4f]/40 flex flex-wrap gap-1.5 items-center justify-center relative z-10">
            {option.attributes && option.attributes.slice(0, 3).map((attr, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-[#8c6d4f]/15 border border-[#8c6d4f]/40 text-[10px] md:text-[11px] font-black text-[#4a2b0f] font-serif uppercase tracking-wider whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#8c6d4f]/25 transition-colors duration-150"
              >
                📜 {attr || 'N/A'}
              </span>
            ))}
            {(!option.attributes || option.attributes.length === 0) && (
              <span className="text-[10px] text-[#5c3c1e]/60 font-serif italic">Keine Attribute</span>
            )}
          </div>
        </div>

        {/* Choose Button */}
        <div className="px-3 pb-3 pt-2 shrink-0">
          <motion.button
            type="button"
            onClick={onChoose}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 px-5 py-5 text-2xl font-black uppercase tracking-widest transition-all duration-75 disabled:cursor-not-allowed disabled:opacity-50 relative z-20 font-medieval',
              cfg.button
            )}
          >
            Wählen
          </motion.button>
        </div>

      </motion.div>
    </motion.div>
  )
}
