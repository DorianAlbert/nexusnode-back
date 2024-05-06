var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection;

/**
 * @openapi
 * /paiements:
 *   get:
 *     tags:
 *       - Paiement
 *     summary: Liste tous les paiements
 *     description: Récupère tous les paiements de la base de données.
 *     responses:
 *       200:
 *         description: Liste récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Paiement'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
    const results = await pool.query('SELECT * FROM Paiement');
    res.status(200).send(results);
});

/**
 * @openapi
 * /paiements/{idPaiement}:
 *   get:
 *     tags:
 *       - Paiement
 *     summary: Affiche le paiement d'une commande par ID
 *     description: Récupère les détails d'un paiement spécifique par son ID.
 *     parameters:
 *       - in: path
 *         name: idPaiement
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du paiement à récupérer
 *     responses:
 *       200:
 *         description: Paiement récupéré avec succès
 *       404:
 *         description: Paiement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:idPaiement', async (req, res) => {
    const { idPaiement } = req.params;
    const results = await pool.query('SELECT * FROM Paiement WHERE idPaiement = ?', [idPaiement]);
    res.status(200).send(results);
});

/**
 * @openapi
 * /paiements:
 *   post:
 *     tags:
 *       - Paiement
 *     summary: Crée un nouveau paiement
 *     description: Ajoute un nouveau paiement dans la base de données.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Paiement'
 *     responses:
 *       201:
 *         description: Paiement créé avec succès
 *       500:
 *         description: Erreur lors de la création du paiement
 */
router.post('/', async (req, res) =>{
    const { datePaiement, Etat } = req.body;
    try {
        const result = await pool.query('INSERT INTO Paiement (datePaiement, Etat) VALUES (?, ?)', [datePaiement, Etat]);
        let newId = result.insertId.toString();
        res.status(201).send({ message: 'Paiement ajouté avec succès', idPaiement: newId });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de l'ajout du paiement", error: error.message });
    }
});

/**
 * @openapi
 * /paiements/{idPaiement}:
 *   patch:
 *     tags:
 *       - Paiement
 *     summary: Modifie un paiement existant
 *     description: Met à jour un paiement existant dans la base de données.
 *     parameters:
 *       - in: path
 *         name: idPaiement
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du paiement à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               Etat:
 *                 type: string
 *                 description: Nouvel état du paiement
 *     responses:
 *       200:
 *         description: Paiement mis à jour avec succès
 *       404:
 *         description: Paiement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:idPaiement', async (req, res) => {
    const { idPaiement } = req.params;
    const { etat } = req.body;
    try {
        const result = await pool.query('UPDATE Paiement SET Etat = ? WHERE idPaiement = ?', [etat, idPaiement]);
        if (result.affectedRows) {
            res.send({ message: 'Paiement mis à jour avec succès' });
        } else {
            res.status(404).send({ message: 'Paiement non trouvé' });
        }
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la mise à jour du paiement", error: error.message });
    }
});

/**
 * @openapi
 * /paiements/{idPaiement}:
 *   delete:
 *     tags:
 *       - Paiement
 *     summary: Supprime un paiement
 *     description: Supprime un paiement de la base de données.
 *     parameters:
 *       - in: path
 *         name: idPaiement
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du paiement à supprimer
 *     responses:
 *       200:
 *         description: Paiement supprimé avec succès
 *       404:
 *         description: Paiement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:idPaiement', async (req, res) => {
    const { idPaiement } = req.params;
    try {
        const result = await pool.query('DELETE FROM Paiement WHERE idPaiement = ?', [idPaiement]);
        if (result.affectedRows) {
            res.send({ message: 'idPaiement supprimé avec succès' });
        } else {
            res.status(404).send({ message: 'idPaiement non trouvé' });
        }
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la suppression du idPaiement", error: error.message });
    }
});

module.exports = router;
