// lib/db.js
import mysql from 'mysql2/promise';

// Creamos una función para conectarnos a la base de datos
// Usamos un pool de conexiones para mayor eficiencia.
export async function query({ query, values = [] }) {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const [results] = await pool.execute(query, values);
    pool.end(); // Cerramos el pool de conexiones
    return results;
  } catch (error) {
    console.error("Error en la consulta a la BBDD:", error);
    throw new Error(error.message);
  }
}