import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { router.push('/login') },
  });
  const router = useRouter();

  const [partidas, setPartidas] = useState([]);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGamePrompt, setNewGamePrompt] = useState(
    "Eres un Dungeon Master de D&D. La aventura empieza en una taberna oscura. El jugador se llama 'Kaelen'. Describe la escena y espera su acción."
  );

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
      body: JSON.stringify({ title: newGameTitle, systemPrompt: newGamePrompt }),
    });
    if (res.ok) {
      const nuevaPartida = await res.json();
      router.push(`/partida/${nuevaPartida.id}`);
    } else {
      alert('Error al crear la partida.');
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
                <label>Título:</label>
                <input
                  type="text"
                  value={newGameTitle}
                  onChange={(e) => setNewGameTitle(e.target.value)}
                  placeholder="La Cripta del Liche Olvidado"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Prompt del Sistema (la misión inicial):</label>
                <textarea
                  value={newGamePrompt}
                  onChange={(e) => setNewGamePrompt(e.target.value)}
                  required
                  rows="5"
                  className={styles.textarea}
                ></textarea>
              </div>
              <button type="submit" className={styles.createButton}>
                Crear y Empezar
              </button>
            </form>
          )}

          <div className={styles.partidasGrid}>
            {partidas.length > 0 ? (
              partidas.map((partida) => (
                <Link key={partida.id} href={`/partida/${partida.id}`} className={styles.partidaCard}>
                  <h3>{partida.title}</h3>
                  <p>Última actualización: {new Date(partida.updatedAt).toLocaleString()}</p>
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