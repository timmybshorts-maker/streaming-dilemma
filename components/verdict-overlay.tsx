'use client'

import { motion } from 'framer-motion'
import { Sparkles, RotateCcw, IdCard, TriangleAlert, X, Scroll } from 'lucide-react'
import type { Steckbrief, ChoiceLog } from '@/lib/dilemmas'
import { cn } from '@/lib/utils'

type VerdictOverlayProps = {
  choice?: string | null
  steckbrief: Steckbrief | null
  generatedText?: string | null
  analyzing: boolean
  round: number
  onNext: () => void
  choices?: ChoiceLog[]
  displayPrefs?: {
    alias?: boolean
    urteil?: boolean
    eigenschaften?: boolean
    diagnose?: boolean
    gefahrenstufe?: boolean
  }
}

export function VerdictOverlay({
  choice,
  steckbrief,
  generatedText,
  analyzing,
  round,
  onNext,
  choices,
}: VerdictOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="KI-Steckbrief"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border-4 border-[var(--color-gold)] bg-stone-950 p-6 shadow-[0_0_60px_-12px_var(--color-primary)] md:p-10 hs-card gold-frame-thick"
      >
        <button
          onClick={onNext}
          className="absolute top-4 right-4 z-50 text-[var(--color-gold)]/60 hover:text-[var(--color-gold)] transition-colors p-1"
          aria-label="Schließen"
        >
          <X className="size-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              'mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-medieval text-xs font-bold uppercase tracking-widest ring-1 gold-frame bg-stone-900/50 text-[var(--color-gold)] ring-[var(--color-gold)]/40',
            )}
          >
            <span>⚔️</span>
            {choice ? `Runde ${round} · Entscheidung gefällt` : `Endergebnis — Dein psychologisches Profil`}
            <span>⚔️</span>
          </span>

          {analyzing || (!steckbrief && !generatedText) ? (
            <div className="flex min-h-[10rem] flex-col items-center justify-center gap-4">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-3 rounded-full bg-primary"
                    animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                KI analysiert dein Versagen...
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex w-full flex-col items-center gap-5"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-gold)]">
                  <IdCard className="size-4" />
                  Dein fieser KI-Steckbrief
                </span>
              </div>

              <div className="relative w-full py-8 px-10 bg-[#1a1612] border-[3px] border-double border-[var(--color-gold)]/40 rounded-xl text-stone-200 shadow-2xl mb-2 text-left">
                <Scroll className="absolute -top-4 -left-4 size-10 text-[var(--color-gold)] bg-stone-950 rounded-full p-2 border-2 border-[var(--color-gold)]" />
                <p className="text-pretty text-xl md:text-2xl font-bold leading-relaxed font-serif text-stone-100 relative z-10 italic first-letter:text-5xl first-letter:font-bold first-letter:text-[var(--color-gold)] first-letter:mr-1 first-letter:float-left">
                  {generatedText || steckbrief?.urteil}
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onNext}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -2 }}
                className="dragon-button mt-4"
              >
                {choice ? '🔄 Nächste Runde 🔄' : '🏰 Zurück zum Menü 🏰'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
