'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { fallbackSteckbrief, type ChoiceLog, type Steckbrief } from '@/lib/dilemmas'
import dynamic from 'next/dynamic'
import { DilemmaCard } from '@/components/dilemma-card'

const CardEditor = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/card-editor'), { ssr: false })
  : () => null
import { VerdictOverlay } from '@/components/verdict-overlay'

export function StreamerDilemma() {
  const [showFullscreenLogo, setShowFullscreenLogo] = useState(false)
  const [round, setRound] = useState(0)
  const [choice, setChoice] = useState<'a' | 'b' | null>(null)
  const [steckbrief, setSteckbrief] = useState<Steckbrief | null>(null)
  const [cards, setCards] = useState<any[] | null>(null)
  const [gamePairs, setGamePairs] = useState<any[] | null>(null)
  const [currentPairIdx, setCurrentPairIdx] = useState(0)
  const [gameActive, setGameActive] = useState(false)
  const [collectedAttributes, setCollectedAttributes] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [decided, setDecided] = useState(0)
  const [generatedText, setGeneratedText] = useState<string | null>(null)
  const choiceLog = useRef<ChoiceLog[]>([])

  // Fetch cards from API
  const refreshCards = useCallback(async () => {
    try {
      const res = await fetch('/api/cards')
      if (res.ok) {
        const data = await res.json()
        setCards(data)
      }
    } catch (err) {
      console.error('Failed to fetch cards', err)
    }
  }, [])

  // Initial load from API
  useEffect(() => {
    refreshCards()
  }, [refreshCards])

  const cardPool = cards || []

  // handle a user's choice during an active game round
  const handleChoose = useCallback(
    (chosenCard: any) => {
      // record choice
      const roundNumber = currentPairIdx + 1
      const entry = { round: roundNumber, side: chosenCard.id, statement: chosenCard.statement, attributes: chosenCard.attributes }
      choiceLog.current = [...choiceLog.current, entry]

      // collect attributes to append to final Steckbrief
      const attrsToAppend = [...collectedAttributes, ...(chosenCard.attributes || [])]
      setCollectedAttributes(attrsToAppend)

      // advance to next pair or finish game
      const next = currentPairIdx + 1
      if (!gamePairs) return
      if (next >= gamePairs.length) {
        // game finished — fetch final medieval Steckbrief using the accumulated choices
        // Set state to trigger verdict overlay loading screen IMMEDIATELY
        setAnalyzing(true)
        setSteckbrief(fallbackSteckbrief(choiceLog.current))
        setGameActive(false)

        const fetchProfileWithRetry = async (retries = 3, delay = 1000): Promise<{ text: string }> => {
          try {
            const res = await fetch('/api/generate-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                choices: choiceLog.current
              }),
            })
            if (!res.ok) {
              throw new Error(`Server responded with ${res.status}`)
            }
            return await res.json()
          } catch (err) {
            if (retries > 0) {
              console.log(`Fetch failed, retrying in ${delay}ms... (${retries} left)`, err)
              await new Promise((resolve) => setTimeout(resolve, delay))
              return fetchProfileWithRetry(retries - 1, delay * 1.5)
            }
            throw err
          }
        }

        fetchProfileWithRetry()
          .then((data) => {
            setGeneratedText(data.text)
          })
          .catch((err) => {
            console.log('[v0] All Steckbrief fetch retries failed, using locally generated fallback:', err?.message)
            // Create a custom sarcastic fallback text so that under ALL circumstances we get a nice plain text Steckbrief
            const choicesSummary = choiceLog.current.map(c => `"${c.statement}"`).join(' und ')
            const fallbackSarcasm = `Herzlichen Glückwunsch, du hast es geschafft. Deine getroffenen Entscheidungen, insbesondere dass du dich für ${choicesSummary} entschieden hast, offenbaren die emotionale Tiefe einer vertrockneten Zimmerpflanze und das strategische Geschick eines betrunkenen Hamsters im Laufrad. Du bist offiziell verloren in den unendlichen Weiten des Internets. Dein Streamer-Dasein ist hiermit psychologisch dekonstruiert: Absolute Ratlosigkeit trifft auf unbändigen Drang zur Selbstsabotage. Cringe ist gar kein Ausdruck mehr für dieses Trauerspiel!`
            setGeneratedText(fallbackSarcasm)
          })
          .finally(() => setAnalyzing(false))
      } else {
        setCurrentPairIdx(next)
      }
    },
    [currentPairIdx, gamePairs, collectedAttributes],
  )

  const handleNext = useCallback(() => {
    // reset for a new game
    choiceLog.current = []
    setSteckbrief(null)
    setGeneratedText(null)
    setAnalyzing(false)
    setGamePairs(null)
    setCurrentPairIdx(0)
    setCollectedAttributes([])
    setGameActive(false)
    setRound(0)
  }, [])

  function startGame() {
    // shuffle cardPool and build up to 5 pairs (10 cards)
    const available = [...cardPool]
    // shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[available[i], available[j]] = [available[j], available[i]]
    }

    const pairs: any[] = []
    const maxPairs = Math.min(5, Math.floor(available.length / 2))
    for (let i = 0; i < maxPairs; i++) {
      pairs.push({ a: available[i * 2], b: available[i * 2 + 1] })
    }
    setGamePairs(pairs)
    setCurrentPairIdx(0)
    choiceLog.current = []
    setCollectedAttributes([])
    setGameActive(true)
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Logo in der oberen linken Ecke */}
      <div 
        className="absolute top-6 left-10 md:top-10 md:left-16 z-50 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group"
        onClick={() => setShowFullscreenLogo(true)}
      >
        <Image
          src="/Timotheus and Timpact.png"
          alt="Timotheus and Timpact Logo"
          width={280}
          height={100}
          className="h-auto w-44 md:w-64 object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
          priority
        />
        <span className="font-serif text-lg md:text-xl uppercase tracking-[0.3em] text-[var(--color-gold)] font-bold opacity-95 group-hover:opacity-100 transition-all drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Credits
        </span>
      </div>

      {/* Fullscreen Logo Overlay */}
      <AnimatePresence>
        {showFullscreenLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreenLogo(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black cursor-zoom-out"
          >
            <Image
              src="/hallway background.jpg"
              alt="Hallway Background"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative z-10 max-w-5xl w-full flex flex-col items-center justify-center p-8"
            >
              <Image
                src="/Timotheus and Timpact.png"
                alt="Timotheus and Timpact Logo Fullscreen"
                width={1200}
                height={600}
                className="w-full h-auto object-contain filter drop-shadow-[0_0_80px_rgba(59,130,246,0.8)] mb-12"
                priority
              />
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4 text-blue-400 border-2 border-blue-500/40 rounded-2xl px-16 py-10 bg-blue-900/20 backdrop-blur-md shadow-[0_0_60px_rgba(59,130,246,0.2)]"
              >
                <span className="font-medieval text-4xl md:text-6xl uppercase tracking-[0.15em] font-bold drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] text-center whitespace-nowrap">
                  Credits: Timotheus und Timpact
                </span>
              </motion.div>
              <p className="mt-4 text-foreground/60 text-sm font-sans uppercase tracking-widest">
                Klicken zum Schließen
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="arena-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-96 rounded-full bg-accent/20 blur-[120px]" />

      <div className="relative mx-auto flex flex-1 w-full max-w-7xl flex-col px-4 py-10 md:px-8 md:py-14">
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-6">
            <CardEditor
              cards={cardPool}
              onRefresh={refreshCards}
            />
          </div>
        )}
        {/* Header */}
        <header className="mb-10 text-center md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-gold)] bg-accent/10 px-4 py-1.5 font-medieval text-xs font-bold uppercase tracking-widest text-accent gold-frame"
          >
            <span>⚔️</span>
            {gameActive && gamePairs ? `Runde ${currentPairIdx + 1} / ${gamePairs.length} · Live im Stream` : 'Lobby · Bereit'}
            <span>⚔️</span>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="fantasy-title-wrapper flex items-center justify-center py-6"
          >
            <div className="fantasy-title-pillars">
              <div className="pillar-left"></div>
              <div className="pillar-right"></div>
            </div>
            <div className="relative z-10 flex justify-center px-4 w-full">
              <Image
                src="/logo2.png"
                alt="Etzala Entscheiden! Zeit für ein Meddl-Duell"
                width={1600}
                height={600}
                priority
                className="h-auto max-h-[500px] md:max-h-[620px] w-auto max-w-[100%] md:max-w-6xl object-contain filter drop-shadow-[0_0_45px_rgba(255,215,0,0.85)] transition-all duration-300 hover:drop-shadow-[0_0_60px_rgba(255,215,0,1)] hover:scale-105"
              />
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-pretty text-base text-foreground/90 font-medium md:text-lg leading-relaxed font-serif bg-black/45 backdrop-blur-sm border border-border/10 rounded-xl px-6 py-4 shadow-xl"
          >
            Zwei grauenhafte Karten. Eine Entscheidung. Null gute Ausgänge.{' '}
            <span className="text-[var(--color-gold)] font-bold text-glow-gold whitespace-nowrap">
              Wir erstellen deinen Steckbrief.
            </span>
          </motion.p>
        </header>

        {/* Arena */}
        <div className="relative flex flex-1 flex-col items-stretch justify-center gap-8 md:flex-row md:gap-14 py-4">
          {!gameActive && (
            <div className="w-full">
              <div className="mb-4 text-center">
                <div className="text-sm ornament-top">Karten im Pool: {cardPool.length}</div>
                <div className="mt-2">
                  <button onClick={startGame} disabled={(cardPool.length < 2)} className="dragon-button">
                    ⚔️ Spiel starten ({Math.min(5, Math.floor(cardPool.length / 2))} Runden) ⚔️
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameActive && gamePairs && (
            <>
              <div className="flex min-h-0 flex-1">
                <DilemmaCard option={gamePairs[currentPairIdx].a} side="a" onChoose={() => handleChoose(gamePairs[currentPairIdx].a)} disabled={false} />
              </div>

              <div className="flex items-center justify-center md:flex-col">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                  className="flex size-14 items-center justify-center rounded-full border-2 border-border bg-card font-mono text-lg font-extrabold uppercase text-foreground shadow-[0_0_30px_-8px_var(--color-primary)] md:size-16 md:text-xl"
                >
                  VS
                </motion.div>
              </div>

              <div className="flex min-h-0 flex-1">
                <DilemmaCard option={gamePairs[currentPairIdx].b} side="b" onChoose={() => handleChoose(gamePairs[currentPairIdx].b)} disabled={false} />
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="w-full bg-black/90 border-t-2 border-[var(--color-gold)]/60 py-4 mt-auto backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <span className="font-medieval text-xs md:text-sm uppercase tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]">
            ⚔️ Kein Streamer wurde bei der Erstellung dieses Spiels ernsthaft verletzt. 🛡️
          </span>
        </div>
      </footer>

      <AnimatePresence>
        {steckbrief !== null && (
          <VerdictOverlay
            steckbrief={steckbrief}
            generatedText={generatedText}
            analyzing={analyzing}
            round={decided}
            onNext={handleNext}
            choices={choiceLog.current}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
