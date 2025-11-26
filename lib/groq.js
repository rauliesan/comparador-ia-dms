// lib/groq.js
import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function getGroqResponse(history) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        // --- CAMBIO CLAVE: Usamos un modelo más reciente y disponible ---
        model: "llama-3.1-8b-instant", 
        messages: history,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error al llamar a la API de Groq:", error.response ? error.response.data : error.message);
    return "Groq no pudo responder en este momento. Revisa la consola del servidor.";
  }
}