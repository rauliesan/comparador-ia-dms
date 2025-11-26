// lib/openai.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatGPTResponse(history) {
  try {
    const response = await openai.chat.completions.create({
      // --- CAMBIO CLAVE: Usamos el nuevo modelo gpt-4o-mini ---
      model: "gpt-4o-mini",
      messages: history,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error al llamar a la API de OpenAI:", error);
    return `Error en ChatGPT: ${error.message}`;
  }
}