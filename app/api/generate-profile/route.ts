import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { type ChoiceLog } from '@/lib/dilemmas';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { choices } = await req.json();
    
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'Grok API Key nicht konfiguriert. Bitte setze GROK_API_KEY im Server-Environment.' },
        { status: 500 }
      );
    }

    const decisionText = (choices as ChoiceLog[])
      .map((c, i) => `Runde ${i + 1}: wählte "${c.statement}"`)
      .join('\n');

    const xai = createXai({ apiKey });
    const aiModel = xai('grok-3'); // Falls grok-3 genutzt wird

    const { text } = await generateText({
      model: aiModel,
      system: `Du bist ein genialer, extrem scharfzüngiger und bitterböser KI-Analytiker mit exzellentem Sinn für Humor. Deine Aufgabe: Nimm die getroffenen "Entweder-Oder"-Entscheidungen des Users und verpacke sie in einen absolut vernichtenden, aber urkomischen Psychogramm-Steckbrief.

      Strenge Regeln für den Schreibstil:
      - Sauberer Satzbau: Nutze kurze, prägnante Sätze und klare Punkt-Setzungen! Vermeide verschachtelte Endlos-Bandwürmer. Setze Punkte, atme kurz durch, hau den nächsten Spruch raus.
      - Struktur: Schreibe 2 bis 3 knackige Absätze mit echtem Rhythmus (kein unleserlicher Mega-Block, sondern gut lesbare, fiese Absätze).
      - Kein langweiliger Einstieg: Beginne NIEMALS mit "Du hast dich entschieden..." oder "In Runde 1...". Steige direkt mit einer herrlich arroganten steilen Thesen oder einem verbalen Kinnhaken ein.
      - Der Vibe: Mische hochgradigen Sarkasmus, Online-Slang (Twitch, Meddl, lost, cringe) und zynische Pseudo-Psychologie zu einer perfekten Mischung. Lass den User spüren, dass seine Entscheidungen tief blicken lassen.
      - Keine künstlichen Aufzählungen oder Listen. Integriere die Entscheidungen unsichtbar, aber unverkennbar als roten Faden in den Text.`,
      prompt: `Hier sind die Entscheidungen des Users:\n\n${decisionText}\n\nSchreibe jetzt die ultimative, böse und extrem unterhaltsame Analyse mit klaren Sätzen und Absätzen!`,
    });

    return Response.json({ text });
  } catch (error: any) {
    console.error('Grok API Error:', error);
    return Response.json({ error: 'Die höfische Schreibstube ist überlastet. (API-Fehler)' }, { status: 500 });
  }
}
