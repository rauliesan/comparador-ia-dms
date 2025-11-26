// components/GameView.js
import { useState, useRef, useEffect } from 'react';

export default function GameView({ gameId, initialMessages, onNewLog }) {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const logDm1Ref = useRef(null);
  const logDm2Ref = useRef(null);

  useEffect(() => {
    // Scroll hasta el final cuando llegan nuevos mensajes
    if (logDm1Ref.current) {
      logDm1Ref.current.scrollTop = logDm1Ref.current.scrollHeight;
    }
    if (logDm2Ref.current) {
      logDm2Ref.current.scrollTop = logDm2Ref.current.scrollHeight;
    }
  }, [initialMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action.trim() || loading) return;

    setLoading(true);
    // Aseguramos que el turno se calcule correctamente
    const lastTurn = initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].turn : -1;
    const currentTurn = lastTurn + 1;
    
    // Añadimos la acción del usuario al log de forma optimista
    onNewLog([{ turn: currentTurn, sender: 'user', content: action }]);
    setAction(''); // Limpiamos el input inmediatamente

    try {
      const response = await fetch('/api/send-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, userAction: action, turn: currentTurn }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la acción');
      }

      const data = await response.json();
      onNewLog([
        { turn: currentTurn, sender: 'dm1', content: data.dm1 },
        { turn: currentTurn, sender: 'dm2', content: data.dm2 }
      ]);
      
    } catch (error) {
      console.error(error);
      // Opcional: manejar el error en la UI, por ejemplo, mostrando un mensaje
      onNewLog([
        { turn: currentTurn, sender: 'dm1', content: "Error al contactar al DM. Revisa la consola." },
        { turn: currentTurn, sender: 'dm2', content: "Error al contactar al DM. Revisa la consola." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="game-grid">
        {/* Columna DM 1 */}
        <div className="dm-column">
          {/* --- TÍTULO ACTUALIZADO --- */}
          <h2 className="dm1-header">Partida con DM 1 (ChatGPT)</h2>
          <div className="log-container" ref={logDm1Ref}>
            {initialMessages.filter(m => m.sender !== 'dm2').map((msg, index) => (
              <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'dm-message'}`}>
                <strong>{msg.sender === 'user' ? 'Tú:' : 'DM 1:'}</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Columna DM 2 */}
        <div className="dm-column">
          <h2 className="dm2-header">Partida con DM 2 (Groq - Llama 3)</h2>
          <div className="log-container" ref={logDm2Ref}>
            {initialMessages.filter(m => m.sender !== 'dm1').map((msg, index) => (
              <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'dm-message'}`}>
                <strong>{msg.sender === 'user' ? 'Tú:' : 'DM 2:'}</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="loader">Ambos DMs están pensando...</div>}

      <form className="action-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="¿Qué haces ahora?"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !action.trim()}>
          Enviar Acción
        </button>
      </form>
    </div>
  );
}