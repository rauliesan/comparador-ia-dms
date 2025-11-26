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

    if (req.method === 'GET') {
        const partidaConMensajes = await prisma.partida.findFirst({
            where: { id: partidaId, userId: session.user.id },
            include: { mensajes: { orderBy: { createdAt: 'asc' } } }
        });
        if (!partidaConMensajes) return res.status(404).json({ message: 'Partida no encontrada' });
        return res.status(200).json(partidaConMensajes);
    }
    
    else if (req.method === 'POST') {
        try {
            const { userPrompt } = req.body;
            await prisma.mensaje.create({ data: { role: 'user', content: userPrompt, partidaId } });
            const partidaActualizada = await prisma.partida.findFirst({
                where: { id: partidaId },
                include: { mensajes: { orderBy: { createdAt: 'asc' } } }
            });

            const buildHistory = (targetRole) => {
                const history = [{ role: 'system', content: partidaActualizada.systemPrompt }];
                partidaActualizada.mensajes.forEach(msg => {
                    if (msg.role === 'user') history.push({ role: 'user', content: msg.content });
                    else if (msg.role === targetRole) history.push({ role: 'assistant', content: msg.content });
                });
                return history;
            };

            const [response1, response2] = await Promise.all([
                groq.chat.completions.create({ model: 'llama-3.1-8b-instant', messages: buildHistory('assistant1') }),
                // ---------- CAMBIO REALIZADO AQUÍ (MODELO FINAL) ----------
                groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: buildHistory('assistant2') })
            ]);

            await prisma.mensaje.createMany({
                data: [
                    { role: 'assistant1', content: response1.choices[0].message.content, partidaId },
                    { role: 'assistant2', content: response2.choices[0].message.content, partidaId },
                ]
            });
            
            await prisma.partida.update({ where: { id: partidaId }, data: { updatedAt: new Date() } });
            return res.status(200).json({ message: "OK" });
        } catch (error) {
            console.error("Error al procesar la acción:", error);
            return res.status(500).json({ message: 'Error al contactar con las IAs' });
        }
    }

    else if (req.method === 'DELETE') {
        try {
            const deleteResult = await prisma.partida.deleteMany({
                where: { id: partidaId, userId: session.user.id }
            });
            if (deleteResult.count === 0) return res.status(404).json({ message: 'Partida no encontrada' });
            return res.status(204).end();
        } catch (error) {
            console.error("Error al borrar la partida:", error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    
    else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}