var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * Afficher toutes les adresses d'un utilisateur spécifique
 */
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const results = await pool.query('SELECT * FROM Adresse WHERE idUser = ?', [userId]);
    res.status(200).send(results);
});

/**
 * Créer une nouvelle adresse pour un utilisateur
 */
router.post('/', async (req, res) => {
    const { rue, ville, CDP, pays, userID } = req.body;
    console.log(req.body);
    const result = await pool.query('INSERT INTO Adresse (rue, ville, CDP, pays, idUser) VALUES (?, ?, ?, ?, ?)', [rue, ville, CDP, pays, userID]);
    let newIdString = result.insertId.toString();
    let newId = parseInt(newIdString);
    res.status(201).send({ idAdresse: newId });
});

/**
 *  Modifier une adresse existante
 */
router.patch('/:idAdresse', async (req, res) => {
    const { idAdresse } = req.params;
    const { rue, ville, CDP, pays, idUser } = req.body;
    await pool.query('UPDATE Adresse SET rue = ?, ville = ?, CDP = ?, pays = ?, idUser = ? WHERE idAdresse = ?', [rue, ville, CDP, pays, idUser, idAdresse]);
    res.status(200).send({ message: 'Adresse mise à jour avec succès' });
});

/**
 * Supprimer une adresse
 */
router.delete('/:idAdresse', async (req, res) => {
    const { idAdresse } = req.params;
    await pool.query('DELETE FROM Adresse WHERE idAdresse = ?', [idAdresse]);
    res.status(200).send({ message: 'Adresse supprimée avec succès' });
});

/**
 *  Afficher une adresse en fonction de son ID
 */
router.get('/:idAdresse', async (req, res) => {
    const { idAdresse } = req.params;
    const results = await pool.query('SELECT * FROM Adresse WHERE idAdresse = ?', [idAdresse]);
    res.status(200).send(results);
});

module.exports = router;
