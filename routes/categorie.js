var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * @openapi
 * /categorie:
 *   get:
 *     tags:
 *       - Catégorie
 *     summary: Récupère toutes les catégories présentes dans la base de données
 *     responses:
 *       200:
 *         description: Liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categorie'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM Categorie');
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        res.status(500).send({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
});

/**
 * @openapi
 * /categorie/{idCat}:
 *   get:
 *     tags:
 *       - Catégorie
 *     summary: Récupère une catégorie en fonction de son ID
 *     parameters:
 *       - in: path
 *         name: idCat
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie à récupérer
 *     responses:
 *       200:
 *         description: Détails d'une catégorie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categorie'
 *       404:
 *         description: Catégorie non trouvée
 */
router.get('/:idCat', async (req, res, next) => {
    const {idCat} = req.params
    try {
        const result = await pool.query('SELECT * FROM Categorie WHERE idCategorie = ?', [idCat]);
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        res.status(500).send({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
});

/**
 * @openapi
 * /categorie:
 *   post:
 *     tags:
 *       - Catégorie
 *     summary: Crée une nouvelle catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req, res) => {
    const { libelle } = req.body;
    try {
        const result = await pool.query('INSERT INTO Categorie (libelle) VALUES (?)', [libelle]);
        res.status(201).send({ message: 'Catégorie créée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la création de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la création de la Catégorie", error: error.message });
    }
});

/**
 * @openapi
 * /categorie:
 *   patch:
 *     tags:
 *       - Catégorie
 *     summary: Modifie une catégorie en fonction de son ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idCategorie:
 *                 type: integer
 *               libelle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catégorie modifiée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.patch('/', async (req, res) => {
    const { idCategorie, libelle } = req.body;
    try {
        const result = await pool.query('UPDATE Categorie set libelle = ? WHERE idCategorie = ?', [libelle, idCategorie]);
        res.status(201).send({ message: 'Catégorie Modifiée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la modification de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la modification de la Catégorie", error: error.message });
    }
});

/**
 * @openapi
 * /categorie/{idCategorie}:
 *   delete:
 *     tags:
 *       - Catégorie
 *     summary: Supprime une catégorie en fonction de son ID
 *     parameters:
 *       - in: path
 *         name: idCategorie
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie à supprimer
 *     responses:
 *       201:
 *         description: Catégorie supprimée avec succès
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete('/:idCategorie', async (req, res) => {
    try{
        const { idCategorie } = req.params;
        const result = await pool.query('DELETE FROM Categorie WHERE idCategorie = ?', [idCategorie]);
        res.status(201).send({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la suppression  de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la création de la Catégorie", error: error.message });
    }
});

module.exports = router;
