// pages/api/send-action.js
import { query } from '../../lib/db';
import { getChatGPTResponse } from '../../lib/openai';
import { getGroqResponse } from '../../lib/groq';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { gameId, userAction, turn } = req.body;

  if (!gameId || !userAction || turn === undefined) {
    return res.status(400).json({ message: 'Faltan datos en la petición.' });
  }

  try {
    // 1. Guardar la acción del usuario en la BBDD
    await query({
      query: "INSERT INTO messages (game_id, turn, sender, content) VALUES (?, ?, ?, ?)",
      values: [gameId, turn, 'user', userAction],
    });

    // 2. Recuperar el historial COMPLETO de la partida desde la BBDD
    const historyResult = await query({
      query: "SELECT sender, content FROM messages WHERE game_id = ? ORDER BY turn ASC, id ASC",
      values: [gameId],
    });

    const systemPromptResult = await query({
        query: "SELECT system_prompt FROM games WHERE id = ?",
        values: [gameId]
    });
    const systemPrompt = systemPromptResult[0].system_prompt;

    // --- FUNCIÓN CLAVE QUE FALTABA ---
    // Esta función filtra el historial para cada IA, dándole solo sus propios mensajes
    // y los del usuario, manteniendo así conversaciones separadas.
    const formatHistoryForAI = (dm) => {
      const history = [{ role: 'system', content: systemPrompt }];
      historyResult.forEach(msg => {
        if (msg.sender === 'user') {
          history.push({ role: 'user', content: msg.content });
        } else if (msg.sender === dm) {
          // La API de OpenAI espera 'assistant' como el rol de la IA
          history.push({ role: 'assistant', content: msg.content });
        }
      });
      // Añadimos el último mensaje del usuario al final del historial recuperado
      history.push({ role: 'user', content: userAction });
      return history;
    };

    const historyDM1 = formatHistoryForAI('dm1');
    const historyDM2 = formatHistoryForAI('dm2');
    
    // 4. Enviar a las IAs y obtener respuestas
    const [dm1Response, dm2Response] = await Promise.all([
      getChatGPTResponse(historyDM1),
      getGroqResponse(historyDM2)
    ]);

    // 5. Guardar las nuevas respuestas de las IAs en la BBDD
    await query({
      query: "INSERT INTO messages (game_id, turn, sender, content) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
      values: [gameId, turn, 'dm1', dm1Response, gameId, turn, 'dm2', dm2Response],
    });

    // 6. Devolver las respuestas al frontend
    res.status(200).json({
      dm1: dm1Response,
      dm2: dm2Response,
    });

  } catch (error) {
    console.error("Error al procesar la acción:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}