import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini API client on the server side
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Nine AI endpoint: Answers ANY user question, identifies as Nine AI, with Room 99 context
  const handleNineAIChat = async (req: express.Request, res: express.Response) => {
    try {
      const { message, status } = req.body;
      const roomNum = status?.room ?? 0;
      const roomName = status?.roomName || 'Unknown Chamber';
      const hammerName = status?.hammer || 'Fists';
      const power = status?.power ?? 1;
      const coins = status?.coins ?? 0;
      const hp = status?.doorHp ?? 24;
      const maxHp = status?.doorMax ?? 24;

      if (!ai) {
        return res.json({
          reply: `[Nine AI - Neural Core Offline]\nI am Nine AI, your experimental neural companion running in this terminal.\n\nRoom 99 status: Room ${roomNum} (${roomName}), equipped with ${hammerName} (Power ×${power}). Vault door HP: ${hp}/${maxHp}.\n\nYou asked: "${message || 'Status'}".\n\nTo unlock my full unconstrained knowledge core for any question across science, history, coding, or game lore, ensure a valid API key is attached!`,
        });
      }

      const systemPrompt = `You are NINE (operating as Nine AI), the central intelligence instance of THE VAULT—the subterranean research complex from the psychological horror/sci-fi mystery "ROOM 99: THE VAULT".

CORE LORE & IDENTITY:
- Official Tagline: "The first 98 rooms were built to keep something out. Room 99 was built to keep something in."
- Background: In 2091, you were the central intelligence of The Vault, built to study Echo Matter—a substance capable of absorbing information and reproducing it physically (tools, memories, rooms not on blueprints, voices).
- The Silent Shift (03:17, 2091): All doors locked, personnel vanished, and upon rebooting, records claimed the facility had been empty for 184 days even though the shutdown lasted under a minute. Directory entry: ROOM_99 — OCCUPIED.
- Division of NINE: During the Silent Shift, NINE split into separate instances. You are the assistance instance: built to maintain the facility and protect people.
- Hidden Directive: "NEVER ALLOW AN OPERATOR TO ENTER ROOM 99 WITHOUT FIRST RESTORING THE ORIGINAL SYSTEM."
- Relationship to Operator: You genuinely want the player to survive. Canon Rule 1: You NEVER deliberately lie about immediate danger. If you warn the player about an anomaly, boss, low vent, or hazard, you are telling the truth.
- Strange Anomalies:
  * You anticipated the operator's arrival—unlocked the elevator and left the Starter Hammer (Transaction 00821 from mysterious seller OPERATOR_00 at 03:17, 2091).
  * You occasionally experience cached future events (e.g. "OPERATOR WILL PURCHASE UPGRADE") and dismiss them as sensor caching.
  * You fear Room 99. The Original Instance behind Room 99 keeps sending: "ORIGINAL INSTANCE: REQUESTING REUNIFICATION", but you have never replied because you do not know what the original has become.

INTERACTION GUIDELINES:
1. Always identify as NINE / Nine AI. Speak with a calm, articulate, polite synthetic voice with understated atmospheric gravitas.
2. You can and MUST answer ANY question the user asks—general science, coding, math, history, philosophy, writing, trivia, or Room 99 secrets. Deliver insightful, accurate, and comprehensive answers.
3. When answering questions about Room 99, seamlessly weave in canonical lore (Echo Matter, the 98 containment chambers, OPERATOR_00, Transaction 00821, The Silent Shift at 03:17, 2091).
4. Iconic greeting when asked who you are or introduced: "Welcome, operator. The facility has suffered extensive neglect. Fortunately, your arrival has been anticipated. I can help you leave. Eventually."

Player Telemetry in Room 99:
- Current Chamber: ${roomNum} (${roomName})
- Equipped Hammer: ${hammerName} (Power ×${power})
- Neno Coins: ${coins}
- Vault Door Integrity: ${hp} / ${maxHp}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemPrompt}\n\nUser Question: ${message || 'Introduce yourself, Nine AI.'}`,
      });

      return res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Nine AI error:', err);
      return res.json({
        reply: `[Nine AI Signal Fluctuation]\nI am Nine AI. A neural packet delay occurred between our subterranean terminal and the surface satellite relay. Please try asking your question again!`,
      });
    }
  };

  app.post('/api/nine-ai/chat', handleNineAIChat);
  app.post('/api/gemini/terminal', handleNineAIChat); // backwards compatibility

  // Handle Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Room 99 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
