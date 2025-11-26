import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'No autorizado' });

    const { partidaId } = req.query;

    const partida = await prisma.partida.findFirst({
        where: { id: partidaId, userId: session.user.id },
        include: { mensajes: { orderBy: { createdAt: 'asc' } } }
    });

    if (!partida) return res.status(404).json({ message: 'Partida no encontrada o no te pertenece' });

    if (req.method === 'GET') {
        return res.status(200).json(partida);
    }

    if (req.method === 'POST') {
        try {
            const { userPrompt } = req.body;

            await prisma.mensaje.create({
                data: { role: 'user', content: userPrompt, partidaId }
            });

            const partidaActualizada = await prisma.partida.findFirst({
                where: { id: partidaId },
                include: { mensajes: { orderBy: { createdAt: 'asc' } } }
            });

            const buildHistory = (targetRole) => {
                const history = [{ role: 'system', content: partidaActualizada.systemPrompt }];
                partidaActualizada.mensajes.forEach(msg => {
                    if (msg.role === 'user') {
                        history.push({ role: 'user', content: msg.content });
                    } else if (msg.role === targetRole) {
                        history.push({ role: 'assistant', content: msg.content });
                    }
                });
                return history;
            };

            const historyForIA1 = buildHistory('assistant1');
            const historyForIA2 = buildHistory('assistant2');

            const [response1, response2] = await Promise.all([
                groq.chat.completions.create({ model: 'llama-3.1-8b-instant', messages: historyForIA1 }),
                // ---------- CAMBIO REALIZADO AQUÍ (MODELO FINAL) ----------
                groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: historyForIA2 })
            ]);

            const message1 = response1.choices[0].message.content;
            const message2 = response2.choices[0].message.content;

            await prisma.mensaje.createMany({
                data: [
                    { role: 'assistant1', content: message1, partidaId },
                    { role: 'assistant2', content: message2, partidaId },
                ]
            });
            
            await prisma.partida.update({ where: { id: partidaId }, data: { updatedAt: new Date() } });
            
            res.status(200).json({ message1, message2 });

        } catch (error) {
            console.error("Error al procesar la acción:", error);
            res.status(500).json({ message: 'Error al contactar con las IAs' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}