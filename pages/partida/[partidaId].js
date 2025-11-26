import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../../styles/Partida.module.css';
import TextareaAutosize from 'react-textarea-autosize';

export default function PartidaPage() {
    const router = useRouter();
    const { partidaId } = router.query;
    const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') }});
    
    const [partida, setPartida] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInput, setUserInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ---------- CAMBIO 1: Creamos DOS referencias, una para cada columna ----------
    const chatEndRef1 = useRef(null);
    const chatEndRef2 = useRef(null);

    // ---------- CAMBIO 2: La función ahora hace scroll en AMBAS referencias ----------
    const scrollToBottom = () => {
        chatEndRef1.current?.scrollIntoView({ behavior: "smooth" });
        chatEndRef2.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (partidaId) {
            fetch(`/api/partida/${partidaId}`)
                .then(res => res.ok ? res.json() : Promise.reject(res))
                .then(data => {
                    setPartida(data);
                    setLoading(false);
                })
                .catch(() => router.push('/'));
        }
    }, [partidaId, router]);

    useEffect(scrollToBottom, [partida]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        
        const currentMessages = partida.mensajes;
        setPartida(prev => ({...prev, mensajes: [...currentMessages, {role: 'user', content: userInput, id: 'temp-user'}]}));
        setUserInput('');

        const res = await fetch(`/api/partida/${partidaId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: userInput }),
        });

        if (res.ok) {
            fetch(`/api/partida/${partidaId}`).then(res => res.json()).then(data => setPartida(data));
        } else {
            alert('Error al enviar la acción.');
            setPartida(prev => ({...prev, mensajes: currentMessages}));
        }
        setIsSubmitting(false);
    };

    const conversationTurns = [];
    if (partida) {
        let currentTurn = { user: null, assistant1: null, assistant2: null };
        partida.mensajes.forEach(msg => {
            if (msg.role === 'user') {
                if (currentTurn.user) {
                    conversationTurns.push(currentTurn);
                    currentTurn = { user: null, assistant1: null, assistant2: null };
                }
                currentTurn.user = msg;
            } else if (msg.role === 'assistant1') {
                currentTurn.assistant1 = msg;
            } else if (msg.role === 'assistant2') {
                currentTurn.assistant2 = msg;
            }
        });
        if (currentTurn.user || currentTurn.assistant1 || currentTurn.assistant2) {
            conversationTurns.push(currentTurn);
        }
    }

    if (loading || status === 'loading') return <div>Cargando partida...</div>;
    if (!partida) return <div><Link href="/">Volver al Dashboard</Link></div>;

    return (
        <>
            <Head><title>{partida.title} | Comparador de DMs</title></Head>
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>&larr; Volver al Dashboard</Link>
                    <h1>{partida.title}</h1>
                </header>
                
                <div className={styles.chatContainer}>
                    <div className={styles.chatColumn}>
                        <h2>Partida con DM 1 (Llama-3.1 8B)</h2>
                        <div className={styles.chatBox}>
                            {conversationTurns.map((turn, index) => (
                                <div key={index}>
                                    {turn.user && (
                                        <div className={styles.userMessageContainer}>
                                            <p className={styles.messageLabel}>Tú</p>
                                            <p className={`${styles.messageBubble} ${styles.userMessage}`}>{turn.user.content}</p>
                                        </div>
                                    )}
                                    {turn.assistant1 && (
                                        <div className={styles.assistantMessageContainer}>
                                            <p className={styles.messageLabel}>DM 1</p>
                                            <p className={`${styles.messageBubble} ${styles.assistantMessage1}`}>{turn.assistant1.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                             {/* ---------- CAMBIO 3: Usamos la primera referencia aquí ---------- */}
                             <div ref={chatEndRef1} />
                        </div>
                    </div>
                    <div className={styles.chatColumn}>
                        <h2>Partida con DM 2 (Mixtral 8x7B)</h2>
                        <div className={styles.chatBox}>
                             {conversationTurns.map((turn, index) => (
                                <div key={index}>
                                    {turn.user && (
                                        <div className={styles.userMessageContainer}>
                                            <p className={styles.messageLabel}>Tú</p>
                                            <p className={`${styles.messageBubble} ${styles.userMessage}`}>{turn.user.content}</p>
                                        </div>
                                    )}
                                     {turn.assistant2 && (
                                        <div className={styles.assistantMessageContainer}>
                                            <p className={styles.messageLabel}>DM 2</p>
                                            <p className={`${styles.messageBubble} ${styles.assistantMessage2}`}>{turn.assistant2.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* ---------- CAMBIO 4: Añadimos la SEGUNDA referencia aquí ---------- */}
                            <div ref={chatEndRef2} />
                        </div>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <TextareaAutosize
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="¿Qué haces ahora?"
                            disabled={isSubmitting}
                            className={styles.textarea}
                            minRows={1}
                            maxRows={6}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <button type="submit" disabled={isSubmitting} className={styles.button}>
                            {isSubmitting ? '...' : 'Enviar'}
                        </button>
                    </form>
                </footer>
            </div>
        </>
    );
}