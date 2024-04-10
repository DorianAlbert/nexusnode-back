var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * Récupere toutes les categories présentes dans la base
 */
router.get('/', async (req, res, next) => {
    try {
        // Exécute la requête pour obtenir toutes les catégories
        const result = await pool.query('SELECT * FROM Categorie');

        // Envoie les résultats de la requête en réponse
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        res.status(500).send({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
});

/**
 * EndPoint pour créer un utilistateur a partir de ces infos ainsi que son Role
 * 1= Client
 * 2= Admin
 * 3= Support
 */
router.post('/', async (req, res) => {
    try {
        const { libelle } = req.body;
        const result = await pool.query('INSERT INTO Categorie (libelle) VALUES (?)', [libelle]);
        res.status(201).send({ message: 'Catégorie créée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la création de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la création de la Catégorie", error: error.message });
    }
});

router.patch('/', async (req, res) => {
    try {
        const { idCategorie, libelle } = req.body;
        const result = await pool.query('UPDATE Categorie set libelle = ? WHERE idCategorie = ?', [libelle, idCategorie]);
        res.status(201).send({ message: 'Catégorie Modifiée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la modification de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la modification de la Catégorie", error: error.message });
    }
});

/**
 * Supprime une categorie en fonction de son id passer en paramètre de la requete
 */
router.delete('/:idCategorie', async (req, res) => {
    try{
    const { idCategorie } = req.params;

        const result = await pool.query('DELETE FROM Categorie WHERE idCategorie = ?', [idCategorie], );

        res.status(201).send({ message: 'Catégorie suprimée avec succès' });
    } catch (error) {
        console.error("Erreur lors de la suppression  de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la création de la Catégorie", error: error.message });
    }
});

module.exports = router;
