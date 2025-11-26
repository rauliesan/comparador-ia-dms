// Archivo: components/CharacterSheetForm.js

import styles from '../styles/Dashboard.module.css';

export default function CharacterSheetForm({ character, setCharacter, scenario, setScenario }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCharacter(prev => ({
      ...prev,
      // Si el campo es un número, lo guardamos como número, si no, como texto
      [name]: e.target.type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  return (
    <>
      {/* --- SECCIÓN DEL PERSONAJE --- */}
      <div className={styles.formSection}>
        <h4 className={styles.sectionTitle}>Define tu Personaje</h4>
        <div className={styles.characterGrid}>
          <div className={styles.inputGroup}>
            <label>Nombre:</label>
            <input name="name" value={character.name} onChange={handleChange} placeholder="Kaelen" required className={styles.input}/>
          </div>
          <div className={styles.inputGroup}>
            <label>Raza:</label>
            <input name="race" value={character.race} onChange={handleChange} placeholder="Elfo" required className={styles.input}/>
          </div>
          <div className={styles.inputGroup}>
            <label>Clase:</label>
            <input name="class" value={character.class} onChange={handleChange} placeholder="Pícaro" required className={styles.input}/>
          </div>
        </div>

        <div className={styles.characterGrid} style={{ marginTop: '1rem' }}>
          <div className={styles.inputGroup}>
            <label>Fuerza:</label>
            <input name="strength" type="number" value={character.strength} onChange={handleChange} required className={styles.input}/>
          </div>
          <div className={styles.inputGroup}>
            <label>Destreza:</label>
            <input name="dexterity" type="number" value={character.dexterity} onChange={handleChange} required className={styles.input}/>
          </div>
          <div className={styles.inputGroup}>
            <label>Vida:</label>
            <input name="life" type="number" value={character.life} onChange={handleChange} required className={styles.input}/>
          </div>
        </div>
      </div>
      
      {/* --- SECCIÓN DEL ESCENARIO --- */}
      <div className={styles.formSection}>
        <h4 className={styles.sectionTitle}>Define el Escenario Inicial</h4>
        <div className={styles.inputGroup}>
          <label>Descripción de la Aventura:</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            required
            rows="4"
            className={styles.textarea}
          ></textarea>
        </div>
      </div>
    </>
  );
}