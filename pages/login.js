import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/AuthForm.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      setError('Credenciales no válidas. Por favor, inténtalo de nuevo.');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión | Comparador de DMs</title>
      </Head>
      <div className="container">
        <div className={styles.card}>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.button}>Entrar</button>
          </form>
          <p className={styles.linkText}>
            ¿No tienes una cuenta?{' '}
            <Link href="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </>
  );
}