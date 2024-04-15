// middleware/database.js
const mariadb = require('mariadb');

// Crée un pool de connexions
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'dev',
    password: '3a8dec982ed29bfc33ded35aaeec0728b50f6f906fd9a7d02b26df45f32e0e81',
    database: 'NexusNode',
    port: 3307,
    connectionLimit: 5 // Définis le nombre de connexions dans le pool
});

// Fonction pour obtenir une connexion et effectuer une requête simple
async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT 1 as val");
        console.log(rows); // [{val: 1}], pour exemple
        console.log('Connecté à la base de données MySQL/MariaDB!');
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release(); // Libère la connexion dans le pool
    }
}

// Exécute la fonction test pour vérifier la connexion
testConnection().then(() => {
    console.log('Test de connexion réussi.');
}).catch((error) => {
    console.error('Erreur lors du test de connexion:', error);
});

// Exporte le pool pour l'utiliser dans d'autres parties de l'application
exports.databaseConnection = pool;
