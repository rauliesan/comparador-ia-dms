// pages/api/start-game.js
import { query } from '../../lib/db';
import { getChatGPTResponse } from '../../lib/openai';
import { getGroqResponse } from '../../lib/groq';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- LÍNEA CLAVE QUE FALTABA O ESTABA INCORRECTA ---
  // Extraemos la variable 'systemPrompt' del cuerpo de la petición.
  const { systemPrompt } = req.body;

  if (!systemPrompt) {
    return res.status(400).json({ message: 'El prompt de sistema es requerido.' });
  }

  try {
    // 1. Crear una nueva partida en la BBDD
    const gameResult = await query({
      query: "INSERT INTO games (system_prompt) VALUES (?)",
      values: [systemPrompt],
    });
    const gameId = gameResult.insertId;

    // 2. Preparar el historial inicial para ambas IAs
    const initialHistory = [{ role: 'system', content: systemPrompt }];

    // 3. Obtener la primera respuesta de ambas IAs simultáneamente
    const [dm1Response, dm2Response] = await Promise.all([
      getChatGPTResponse(initialHistory),
      getGroqResponse(initialHistory)
    ]);

    // 4. Guardar las respuestas iniciales en la BBDD
    await query({
      query: "INSERT INTO messages (game_id, turn, sender, content) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
      values: [gameId, 0, 'dm1', dm1Response, gameId, 0, 'dm2', dm2Response],
    });

    // 5. Devolver el ID de la partida y las respuestas iniciales
    res.status(201).json({
      gameId,
      initialResponses: {
        dm1: dm1Response,
        dm2: dm2Response,
      },
    });

  } catch (error) {
    console.error("Error al iniciar el juego:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}