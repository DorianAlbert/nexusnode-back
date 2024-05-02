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
/**
 * ajoute un nouveau Paiement
 */
router.post('/', async (req, res) =>{
    console.log(req.body);
    const{datePaiement, Etat} = req.body;
    try {
        const result = await pool.query('INSERT INTO Paiement (datePaiement, Etat) VALUES (?, ?)', [datePaiement, Etat]);
        let newIdString = result.insertId.toString();
        let newId = parseInt(newIdString);
        console.log(newId);
        console.log(result)
        res.status(201).send({ message: 'Paiement ajouté avec succès', idPaiement: newId });
    } catch (error) {
        console.error("Erreur lors de l'ajout du Paiement:", error);
        res.status(500).send({ message: "Erreur lors de l'ajout du Paiement", error: error.message });
    }});
/**
 * Modifie un paiement selon son id
 */
router.patch('/:idPaiement', async (req, res) => {
    const { idPaiement } = req.params;
    const{etat} = req.body;
    try {
        const result = await pool.query('UPDATE Paiement SET Etat = ? WHERE idPaiement = ?', [etat, idPaiement]);
        if (result.affectedRows) {
            res.send({ message: 'Paiement mis à jour avec succès' });
        } else {
            res.status(404).send({ message: 'Paiement non trouvé' });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du Paiement:", error);
        res.status(500).send({ message: "Erreur lors de la mise à jour du Paiement", error: error.message });
    }
});
/**
 * Supprime un matériel en fonction de son ID
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
        console.error("Erreur lors de la suppression du idPaiement:", error);
        res.status(500).send({ message: "Erreur lors de la suppression du idPaiement", error: error.message });
    }
});

module.exports = router;
