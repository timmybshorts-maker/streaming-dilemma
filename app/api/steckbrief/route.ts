import { generateText, Output } from 'ai'
import { z } from 'zod'
import { fallbackSteckbrief, type ChoiceLog } from '@/lib/dilemmas'

export const maxDuration = 30

const steckbriefSchema = z.object({
  alias: z
    .string()
    .describe('Ein absurd witziger, erfundener Streamer-Titel/Spitzname, 2-5 Wörter, deutsch.'),
  urteil: z
    .string()
    .describe('Ein einziger, gnadenlos witziger Urteils-Satz der KI über den Spieler.'),
  eigenschaften: z
    .array(z.string())
    .length(3)
    .describe('Genau 3 kurze, überspitzt lustige Charaktereigenschaften basierend auf den Entscheidungen.'),
  diagnose: z.string().describe('Eine finale, komödiantische "Diagnose" in einem Satz.'),
  gefahrenstufe: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Eine augenzwinkernde Gefahrenstufe von 1 (harmlos) bis 10 (Weltuntergang).'),
})

export async function POST(req: Request) {
  let choices: ChoiceLog[] = []
  try {
    const body = await req.json()
    choices = Array.isArray(body?.choices) ? body.choices : []
  } catch {
    choices = []
  }

  const decisionText = choices
    .map((c, i) => `Runde ${i + 1}: wählte "${c.statement}"`)
    .join('\n')

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4.1-mini',
      output: Output.object({ schema: steckbriefSchema }),
      system:
        'Du bist eine chaotische, schlagfertige KI-Jury in einer deutschen Twitch-Gameshow ' +
        'namens "Etzala Entscheiden! - Meddl-Duell". Dein Humor ist absurd, frech und liebevoll ' +
        'beleidigend im Stil deutscher Streamer-Memes (Meddl-Kultur), aber niemals ernsthaft ' +
        'verletzend, diskriminierend oder vulgär. Du erstellst einen lustigen Steckbrief über den ' +
        'Spieler ausschließlich anhand seiner absurden Entscheidungen. Antworte immer auf Deutsch.',
      prompt:
        `Ein Streamer hat in einem "Entweder-Oder"-Spiel folgende absurde Entscheidungen getroffen:\n\n` +
        `${decisionText || 'Noch keine Entscheidungen.'}\n\n` +
        `Erstelle daraus einen übertrieben lustigen Steckbrief.`,
    })

    return Response.json(output)
  } catch (error) {
    console.log('[v0] Steckbrief AI error, using fallback:', (error as Error)?.message)
    return Response.json(fallbackSteckbrief(choices))
  }
}
