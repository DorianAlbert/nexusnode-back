var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
var pool = require('../middleware/database').databaseConnection

/* GET users listing. */
router.get('/', function(req, res, next) {
});

/**
 * EndPoint pour créer un utilistateur a partir de ces infos ainsi que son Role
 * 1= Client
 * 2= Admin
 * 3= Support
 */
router.post('/', async (req, res) => {
    try {
        const {libelle} = req.body;
        const result = await pool.query('INSERT INTO Categorie (libelle) VALUES (?)', [libelle]);
        res.status(201).send({ message: 'Catégorie créé avec succès' });
    } catch (error) {
        console.error("Erreur lors de la création de la Catégorie:", error);
        res.status(500).send({ message: "Erreur lors de la création de la Catégorie", error: error.message });
    }
});
module.exports = router;
