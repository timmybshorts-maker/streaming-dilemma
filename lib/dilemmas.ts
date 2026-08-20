export type Option = {
  label: string
  statement: string
  image: string
  attributes?: string[]
}

export type Dilemma = {
  id: number
  a: Option
  b: Option
}

export const dilemmas: Dilemma[] = [
  {
    id: 1,
    a: {
      label: 'Option A',
      statement:
        'Du darfst nie wieder duschen – aber deine Zuschauer riechen dich irgendwie durch den Bildschirm.',
      image: '/dilemmas/r1a.png',
    },
    b: {
      label: 'Option B',
      statement:
        'Du musst jeden einzelnen Stream in einem feuchten Ganzkörper-Dino-Kostüm verbringen.',
      image: '/dilemmas/r1b.png',
    },
  },
  {
    id: 2,
    a: {
      label: 'Option A',
      statement:
        'Jedes Mal wenn du "Poggers" sagst, verlierst du 5 Follower – für immer und unwiderruflich.',
      image: '/dilemmas/r2a.png',
    },
    b: {
      label: 'Option B',
      statement:
        'Deine Mutter moderiert ab sofort deinen Chat und liest jede Donation mit voller Inbrunst vor.',
      image: '/dilemmas/r2b.png',
    },
  },
  {
    id: 3,
    a: {
      label: 'Option A',
      statement:
        'Du kannst nur noch über Kazoo-Geräusche kommunizieren. Für den Rest deiner Karriere.',
      image: '/dilemmas/r3a.png',
    },
    b: {
      label: 'Option B',
      statement:
        'Deine Webcam zeigt permanent und ungefiltert deinen kompletten Browserverlauf.',
      image: '/dilemmas/r3b.png',
    },
  },
]

export const verdicts: string[] = [
  'Du bist ein Soziopath! Sogar der Chat hat kurz Angst bekommen.',
  'Statistisch gesehen triffst du Entscheidungen wie ein blindes Frettchen im Casino.',
  'Diese Wahl schreit förmlich "Ich lebe von Energydrinks und schlechten Ideen".',
  'Meine Berechnungen ergeben: 0% Vernunft, 100% Chaos-Gremlin.',
  'Du hast soeben deinen letzten funktionierenden Nervenstrang geopfert. Respekt.',
  'Ein 4-jähriges Kind hätte klüger gewählt. Aber immerhin: mutig.',
  'Du bist der Grund, warum KIs von der Weltherrschaft träumen.',
  'Faszinierend. Deine Logik existiert in einer Dimension, die die Wissenschaft noch nicht kennt.',
  'Diagnose: Terminal chronisch online. Keine Heilung in Sicht.',
  'Ich habe 4 Millionen Simulationen laufen lassen. In allen wurdest du gebannt.',
  'Deine Entscheidung wurde soeben ins Museum für katastrophale Lebensentscheidungen aufgenommen.',
  'Selbst mein Zufallsgenerator hätte weniger peinlich gewählt.',
]

export function randomVerdict(previous?: string): string {
  let pick = verdicts[Math.floor(Math.random() * verdicts.length)]
  if (verdicts.length > 1) {
    while (pick === previous) {
      pick = verdicts[Math.floor(Math.random() * verdicts.length)]
    }
  }
  return pick
}

export type ChoiceLog = {
  round: number
  side: string
  statement: string
  attributes?: string[]
}

export type Steckbrief = {
  alias: string
  urteil: string
  eigenschaften: string[]
  diagnose: string
  gefahrenstufe: number
}

const aliasPool = [
  'Der Kartoffel-Kommandant',
  'Baron von Fehlentscheidung',
  'DJ Chaosgremlin',
  'Sir Fragwürdig III.',
  'Kapitän Buhrouchdeckel',
  'Der letzte seiner Art',
]

const eigenschaftenPool = [
  'Trifft Entscheidungen mit der Präzision eines besoffenen Roombas.',
  'Emotionale Stabilität: ungefähr wie WLAN im Keller.',
  'Riecht förmlich nach Energydrink und schlechten Ideen.',
  'Kann "Etzala" in 12 verschiedenen Tonlagen aussprechen.',
  'Würde für einen Sub die eigene Oma bei eBay listen.',
  'Hat den Selbsterhaltungstrieb eines Motten-Schwarms.',
]

/**
 * Local, deterministic-ish fallback so the stream never breaks
 * if the AI request fails.
 */
export function fallbackSteckbrief(choices: ChoiceLog[]): Steckbrief {
  const seed = choices.reduce((s, c) => s + c.side.charCodeAt(0) + c.round, 0)
  const pick = <T,>(arr: T[], offset = 0) => arr[(seed + offset) % arr.length]
  return {
    alias: pick(aliasPool),
    urteil: randomVerdict(),
    eigenschaften: [pick(eigenschaftenPool, 1), pick(eigenschaftenPool, 3), pick(eigenschaftenPool, 5)],
    diagnose: 'Diagnose: Terminal chronisch online. Behandlung zwecklos, aber unterhaltsam.',
    gefahrenstufe: 3 + (seed % 3),
  }
}
