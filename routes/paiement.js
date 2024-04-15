var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * Afficher la liste de tout les paiement
 */
router.get('/', async (req, res) => {
    const { userId } = req.params;
    const results = await pool.query('SELECT * FROM Paiement');
    res.status(200).send(results);
});
/**
 * Affiche le Paiement d'une commande en ayant le IdPaiement
 */
router.get('/:idPaiement', async (req, res) => {
    const { idPaiement } = req.params;
    const results = await pool.query('SELECT * FROM Paiement WHERE idPaiement = ?', [idPaiement]);
    res.status(200).send(results);
});

router.post('/'), async (req, res) =>{
    const{}
}



module.exports = router;
