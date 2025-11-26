import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const partidas = await prisma.partida.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    res.status(200).json(partidas);
  } catch (error) {
    console.error("Error al obtener las partidas:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}