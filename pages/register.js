import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/AuthForm.module.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      const data = await res.json();
      setError(data.message || 'Algo salió mal.');
    }
  };

  return (
    <>
      <Head>
        <title>Registro | Comparador de DMs</title>
      </Head>
      <div className="container">
        <div className={styles.card}>
          <h1 className={styles.title}>Crear una Cuenta</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>¡Cuenta creada! Redirigiendo...</p>}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                disabled={success}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Contraseña (mín. 6 caracteres)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                disabled={success}
              />
            </div>
            <button type="submit" className={styles.button} disabled={success}>
              Registrarse
            </button>
          </form>
          <p className={styles.linkText}>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login">Inicia Sesión aquí</Link>
          </p>
        </div>
      </div>
    </>
  );
}