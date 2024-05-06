var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * Afficher toutes les adresses d'un utilisateur spécifique
 */
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const results = await pool.query('SELECT * FROM Adresse WHERE idUser = ?', [userId]);
    res.status(200).send(results);
});

/**
 * Créer une nouvelle adresse pour un utilisateur
 */
router.post('/', async (req, res) => {
    const { rue, ville, CDP, pays, userID } = req.body;
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

/**
 * @openapi
 * /adresse/{userId}:
 *   get:
 *     summary: Récupère toutes les adresses associées à un utilisateur spécifique
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'utilisateur
 *     responses:
 *       200:
 *         description: Une liste des adresses de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Adresse'
 *       404:
 *         description: Aucune adresse trouvée pour cet utilisateur
 */

/**
 * @openapi
 * /adresse:
 *   post:
 *     summary: Crée une nouvelle adresse pour un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdresseInput'
 *     responses:
 *       201:
 *         description: Adresse créée avec succès, renvoie l'ID de la nouvelle adresse.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idAdresse:
 *                   type: integer
 *                   description: L'ID de la nouvelle adresse créée
 *       400:
 *         description: Données invalides fournies
 */

/**
 * @openapi
 * /adresse/{idAdresse}:
 *   patch:
 *     summary: Modifie une adresse existante
 *     parameters:
 *       - in: path
 *         name: idAdresse
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'adresse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdresseInput'
 *     responses:
 *       200:
 *         description: Adresse mise à jour avec succès
 *       404:
 *         description: Adresse non trouvée
 */

/**
 * @openapi
 * /adresse/{idAdresse}:
 *   delete:
 *     summary: Supprime une adresse
 *     parameters:
 *       - in: path
 *         name: idAdresse
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'adresse à supprimer
 *     responses:
 *       200:
 *         description: Adresse supprimée avec succès
 *       404:
 *         description: Adresse non trouvée
 */

/**
 * @openapi
 * /adresse/{idAdresse}:
 *   get:
 *     summary: Récupère les détails d'une adresse spécifique
 *     parameters:
 *       - in: path
 *         name: idAdresse
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'adresse
 *     responses:
 *       200:
 *         description: Détails de l'adresse demandée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Adresse'
 *       404:
 *         description: Adresse non trouvée
 */

/**
 * Components schemas to be added to the bottom of your Swagger config or referenced file.
 * @openapi
 * components:
 *   schemas:
 *     Adresse:
 *       type: object
 *       properties:
 *         idUser:
 *           type: integer
 *         rue:
 *           type: string
 *         ville:
 *           type: string
 *         CDP:
 *           type: string
 *         pays:
 *           type: string
 *     AdresseInput:
 *       type: object
 *       required:
 *         - rue
 *         - ville
 *         - CDP
 *         - pays
 *         - userID
 *       properties:
 *         rue:
 *           type: string
 *         ville:
 *           type: string
 *         CDP:
 *           type: string
 *         pays:
 *           type: string
 *         userID:
 *           type: integer
*/

module.exports = router;
