// Archivo: pages/index.js

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import IconTrash from '../components/IconTrash';
import CharacterSheetForm from '../components/CharacterSheetForm'; // CAMBIO 1: Importamos el nuevo componente

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { router.push('/login') },
  });
  const router = useRouter();

  const [partidas, setPartidas] = useState([]);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  
  // CAMBIO 2: Reemplazamos los estados antiguos por estados más estructurados
  const [newGameTitle, setNewGameTitle] = useState('');
  const [character, setCharacter] = useState({
    name: 'Kaelen',
    race: 'Elfo',
    class: 'Pícaro',
    strength: 8,
    dexterity: 18,
    life: 25,
  });
  const [scenario, setScenario] = useState("La aventura empieza en una taberna oscura. Describe la escena y espera la acción del jugador.");
  const [finalPrompt, setFinalPrompt] = useState('');

  // CAMBIO 3: Usamos useEffect para construir el prompt final dinámicamente
  useEffect(() => {
    const characterInfo = `El jugador se llama '${character.name}', es un ${character.race} ${character.class} con Fuerza ${character.strength}, Destreza ${character.dexterity} y ${character.life} puntos de vida.`;
    const prompt = `Eres un Dungeon Master de Dungeons & Dragons. ${characterInfo} ${scenario}`;
    setFinalPrompt(prompt);
  }, [character, scenario]); // Se actualiza cada vez que el personaje o el escenario cambian


  useEffect(() => {
    if (session) {
      fetch('/api/partidas')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setPartidas(data));
    }
  }, [session]);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/partidas/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // CAMBIO 4: Enviamos el `finalPrompt` que hemos construido
      body: JSON.stringify({ title: newGameTitle, systemPrompt: finalPrompt }),
    });
    if (res.ok) {
      const nuevaPartida = await res.json();
      router.push(`/partida/${nuevaPartida.id}`);
    } else {
      alert('Error al crear la partida.');
    }
  };

  const handleDelete = async (partidaId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("¿Estás seguro de que quieres borrar esta partida? Esta acción no se puede deshacer.")) {
      const res = await fetch(`/api/partida/${partidaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPartidas(partidas.filter(partida => partida.id !== partidaId));
      } else {
        alert("Error al borrar la partida.");
      }
    }
  };

  if (status === 'loading') {
    return <div className="container"><p>Cargando sesión...</p></div>;
  }

  return (
    <>
      <Head>
        <title>Dashboard | Comparador de DMs</title>
      </Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Mis Partidas</h1>
          <div className={styles.userInfo}>
            <span>Bienvenido, <strong>{session.user.email}</strong></span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main>
          <button onClick={() => setShowNewGameForm(!showNewGameForm)} className={styles.newGameButton}>
            {showNewGameForm ? 'Cancelar' : '＋ Nueva Partida'}
          </button>

          {showNewGameForm && (
            <form onSubmit={handleCreateGame} className={styles.form}>
              <h3>Crear Nueva Partida</h3>
              <div className={styles.inputGroup}>
                <label>Título de la Partida:</label>
                <input type="text" value={newGameTitle} onChange={(e) => setNewGameTitle(e.target.value)} placeholder="La Cripta del Liche Olvidado" required className={styles.input}/>
              </div>
              
              {/* CAMBIO 5: Reemplazamos el textarea antiguo por el nuevo componente */}
              <CharacterSheetForm 
                character={character}
                setCharacter={setCharacter}
                scenario={scenario}
                setScenario={setScenario}
              />
              
              <button type="submit" className={styles.createButton}>
                Crear y Empezar
              </button>
            </form>
          )}

          <div className={styles.partidasGrid}>
            {partidas.length > 0 ? (
              partidas.map((partida) => (
                <Link key={partida.id} href={`/partida/${partida.id}`} className={styles.partidaCard}>
                  <div>
                    <h3>{partida.title}</h3>
                    <p>Última actualización: {new Date(partida.updatedAt).toLocaleString()}</p>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDelete(partida.id, e)}
                    title="Borrar partida"
                  >
                    <IconTrash />
                  </button>
                </Link>
              ))
            ) : (
              <p>No tienes partidas. ¡Crea una nueva para empezar!</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}