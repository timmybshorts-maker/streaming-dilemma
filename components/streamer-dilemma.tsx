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
  const [devApiKey, setDevApiKey] = useState('')
  const [devProvider, setDevProvider] = useState<'google' | 'xai'>('xai')
  const [devModel, setDevModel] = useState('grok-3')
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

  // Initial load from API and settings from localStorage
  useEffect(() => {
    refreshCards()

    const savedApiKey = localStorage.getItem('dev-api-key')
    if (savedApiKey) setDevApiKey(savedApiKey)

    const savedProvider = localStorage.getItem('dev-provider') as 'google' | 'xai'
    if (savedProvider) setDevProvider(savedProvider)

    const savedModel = localStorage.getItem('dev-model')
    if (savedModel) setDevModel(savedModel)
  }, [refreshCards])

  // Persist settings
  useEffect(() => {
    localStorage.setItem('dev-api-key', devApiKey)
    localStorage.setItem('dev-provider', devProvider)
    localStorage.setItem('dev-model', devModel)
  }, [devApiKey, devProvider, devModel])

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
                choices: choiceLog.current,
                customApiKey: devApiKey || undefined,
                provider: devProvider,
                model: devModel
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
    [currentPairIdx, gamePairs, collectedAttributes, devApiKey, devProvider, devModel],
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
      <div className="arena-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-96 rounded-full bg-accent/20 blur-[120px]" />

      <div className="relative mx-auto flex flex-1 w-full max-w-7xl flex-col px-4 py-10 md:px-8 md:py-14">
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-6">
            <div className="bg-black/50 p-4 rounded-xl border border-[var(--color-gold)]/30 backdrop-blur-md">
              <div>
                <label className="block text-xs font-mono mb-2 text-[var(--color-gold)] text-center">xAI (Grok 3) API Key</label>
                <input 
                  type="password" 
                  value={devApiKey} 
                  onChange={(e) => setDevApiKey(e.target.value)}
                  placeholder="Hinterlege hier deinen xAI API-Key..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]"
                />
              </div>
            </div>
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
