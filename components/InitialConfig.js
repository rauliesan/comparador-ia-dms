// components/InitialConfig.js
import { useState } from 'react';

const DEFAULT_PROMPT = "Eres un Dungeon Master de D&D. La aventura empieza en una taberna oscura y lúgubre llamada 'El Dragón Bostezando'. El jugador se llama 'Kaelen', un pícaro elfo con una reputación dudosa. Describe la escena de manera evocadora y espera la primera acción de Kaelen.";

export default function InitialConfig({ onStartGame, loading }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onStartGame(prompt);
    }
  };

  return (
    <div>
      <h2>1. Configuración de la Partida</h2>
      <p>Define el prompt inicial del sistema. Este será idéntico para ambas IAs y marcará el tono de la aventura.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="8"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe aquí el prompt del sistema..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Empezando Aventura...' : '¡Comenzar Comparación!'}
        </button>
      </form>
    </div>
  );
}