import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { type ChoiceLog } from '@/lib/dilemmas';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { choices, customApiKey, provider = 'google', model = 'gemini-1.5-flash' } = await req.json();
    
    const apiKey = customApiKey || (provider === 'xai' ? process.env.XAI_API_KEY : process.env.GEMINI_API_KEY);

    if (!apiKey) {
      return Response.json({ error: `Kein API-Key für ${provider} konfiguriert. Bitte im Dev-Modus einen Key hinterlegen.` }, { status: 400 });
    }

    const decisionText = (choices as ChoiceLog[])
      .map((c, i) => `Runde ${i + 1}: wählte "${c.statement}"`)
      .join('\n');

    let aiModel;
    if (provider === 'xai') {
      const xai = createXai({ apiKey });
      // xAI uses grok-2-1212 or similar modern model names. Map to grok-2 if chosen
      const mappedModel = model.startsWith('grok') ? model : 'grok-2';
      aiModel = xai(mappedModel);
    } else {
      const google = createGoogleGenerativeAI({ apiKey });
      aiModel = google(model);
    }

    const { text } = await generateText({
      model: aiModel,
      system: `Du bist ein extrem sarkastischer, scharfzüngiger und leicht bösartiger KI-Beobachter. Deine Aufgabe ist es, den Nutzer basierend auf all seinen absurden und moralisch verwerflichen "Entweder-Oder"-Entscheidungen im Spiel humorvoll vorzuführen, ihn zu interpretieren und ordentlich lächerlich zu machen (fiese aber witzige Demütigung).
      
      Strenge Regeln:
      - Regel 1: Der Text darf NIEMALS mit einer offensichtlichen Auflistung der Entscheidungen (z. B. "Du hast dich für ... entschieden" oder "In Runde 1 wähltest du...") beginnen. Keine plumpe Zusammenfassung am Anfang!
      - Regel 2: Die Entscheidungen des Users müssen subtil, organisch und fließend in eine zusammenhängende, erzählerische Bewertung eingewoben werden.
      - Regel 3: Maximale Abwechslung bei der Einleitung! Jeder generierte Text muss völlig anders starten (z. B. mit einem tiefenphilosophischen Seufzer, einer wilden Analogie, einem direkten verbalen Tiefschlag oder einem satirischen Mitleidsbekundung).
      - Regel 4: Der Ton bleibt hochgradig sarkastisch, respektlos, trocken, humorvoll und führt den User vor, aber auf intelligente, kreative Weise (kein billiges Draufhauen, sondern meisterhafte, böse Ironie).
      - Antworte AUSSCHLIESSLICH mit einem einzigen, zusammenhängenden Fließtext (reiner, unstrukturierter Fließtext).
      - Entferne jeglichen Schnick-Schnack: Keine Titel (wie "Steckbrief"), keine Attribute, keine Gefahrstufen, keine Listen, kein Markdown mit Sternchen, keine Tabellen, keine Absätze. Nur Fließtext!
      - Interpretiere humorvoll/sarkastisch, was diese Entscheidungen über die Psyche, den erbärmlichen Charakter oder die absolute Online-Verlorenheit des Nutzers aussagen.
      - Nutze eine moderne, "chronisch online" Sprache (Twitch-Slang wie "cringe", "wild", "lost", "Poggers", "Meddl" etc.) gemischt mit pseudo-intellektueller Küchenpsychologie.
      - Fang direkt mit dem Text an. Keine einleitenden Floskeln wie "Hier ist dein Text" oder "Basierend auf deinen Entscheidungen...". Starte direkt mit der knallharten, fiesen Analyse.`,
      prompt: `Hier sind alle getroffenen Entscheidungen des Nutzers über alle Runden:\n\n${decisionText}\n\nAnalysiere und interpretiere diese Entscheidungen unter strikter Einhaltung der oben genannten Regeln. Schreibe einen humorvollen, kreativen Fließtext (ohne Titel, ohne Formatierung, ohne Absätze, reiner Text), der den Charakter des Nutzers gnadenlos entlarvt und ihn lächerlich macht!`,
    });

    return Response.json({ text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return Response.json({ error: 'Die höfische Schreibstube ist überlastet. (API-Fehler)' }, { status: 500 });
  }
}
