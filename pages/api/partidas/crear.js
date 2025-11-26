import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.method === 'POST') {
    try {
      const { title, systemPrompt } = req.body;

      if (!title || !systemPrompt) {
        return res.status(400).json({ message: 'El título y el prompt del sistema son requeridos.' });
      }

      const nuevaPartida = await prisma.partida.create({
        data: {
          title,
          systemPrompt,
          userId: session.user.id,
        },
      });

      const initialMessages = [{ role: 'system', content: systemPrompt }];
      const [response1, response2] = await Promise.all([
        groq.chat.completions.create({ model: 'llama-3.1-8b-instant', messages: initialMessages }),
        // ---------- CAMBIO REALIZADO AQUÍ (MODELO FINAL) ----------
        groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: initialMessages })
      ]);

      const message1 = response1.choices[0].message.content;
      const message2 = response2.choices[0].message.content;

      await prisma.mensaje.createMany({
        data: [
            { role: 'assistant1', content: message1, partidaId: nuevaPartida.id },
            { role: 'assistant2', content: message2, partidaId: nuevaPartida.id },
        ]
      });

      res.status(201).json(nuevaPartida);
    } catch (error) {
      console.error("Error al crear la partida:", error);
      res.status(500).json({ message: 'Error interno del servidor al crear la partida' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}