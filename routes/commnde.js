var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

/**
 * Afficher toutes les commandes
 */
router.get('/commandes', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM Commande');
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la récupération des commandes', error: error.message });
    }
});

/**
 * Afficher toutes les commandes d'un utilisateur spécifique
 */

 router.get('/commandes/user/:idUser', async (req, res) => {
    const { idUser } = req.params;
    try {
        const results = await pool.query('SELECT * FROM Commande WHERE idUser = ?', [idUser]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des commandes de l'utilisateur", error: error.message });
    }
});

/**
 * Afficher toutes les commandes entre deux dates
 */
router.get('/commandes/date', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const results = await pool.query('SELECT * FROM Commande WHERE dateCommande BETWEEN ? AND ?', [startDate, endDate]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des commandes par dates", error: error.message });
    }
});
/**
 * Afficher toutes les commandes d'un utilisateur entre deux dates
 */
router.get('/commandes/user/:idUser/date', async (req, res) => {
    const { idUser } = req.params;
    const { startDate, endDate } = req.query;
    try {
        const results = await pool.query('SELECT * FROM Commande WHERE idUser = ? AND dateCommande BETWEEN ? AND ?', [idUser, startDate, endDate]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des commandes de l'utilisateur par dates", error: error.message });
    }
});

/**
 * Ajouter une commande
 */
router.post('/commandes', async (req, res) => {
    const { dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser } = req.body;
    try {
        const result = await pool.query('INSERT INTO Commande (dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser) VALUES (?, ?, ?, ?, ?, ?)', [dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser]);
        res.status(201).send({ idCommande: result.insertId });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de l'ajout de la commande", error: error.message });
    }
});

/**
 * Modifier une commande existante
 */
router.put('/commandes/:idCommande', async (req, res) => {
    const { idCommande } = req.params;
    const { dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser } = req.body;
    try {
        await pool.query('UPDATE Commande SET dateCommande = ?, nomFacture = ?, cheminFacture = ?, idPaiement = ?, idAdresse = ?, idUser = ? WHERE idCommande = ?', [dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser, idCommande]);
        res.status(200).send({ message: 'Commande mise à jour avec succès' });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la mise à jour de la commande", error: error.message });
    }
});

/**
 * Supprimer une commande
 */
router.delete('/commandes/:idCommande', async (req, res) => {
    const { idCommande } = req.params;
    try {
        await pool.query('DELETE FROM Commande WHERE idCommande = ?', [idCommande]);
        res.status(200).send({ message: 'Commande supprimée avec succès' });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la suppression de la commande", error: error.message });
    }
});

/**
 *  Récupérer tous les Articles d'une commande par l'ID de la commande
 */
router.get('/commandes/:idCommande/materiels', async (req, res) => {
    const { idCommande } = req.params;
    try {
        const results = await pool.query(
            'SELECT m.libelle, m.description, dc.quantite, m.prix FROM DetailCommande dc ' +
            'JOIN Materiel m ON dc.idMateriel = m.idMateriel WHERE dc.idCommande = ?', [idCommande]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la récupération des matériaux de la commande', error: error.message });
    }
});

/**
 * Obtenir les libellés de chaque matériel, la quantité vendue entre deux dates et le prix total
 */
router.get('/materiels/ventes/:startDate/:endDate', async (req, res) => {
    const { startDate, endDate } = req.params;
    try {
        const results = await pool.query(
            'SELECT m.libelle, SUM(dc.quantite) AS quantite_vendue, SUM(dc.quantite * m.prix) AS prix_total FROM DetailCommande dc ' +
            'JOIN Materiel m ON dc.idMateriel = m.idMateriel ' +
            'JOIN Commande c ON dc.idCommande = c.idCommande ' +
            'WHERE c.dateCommande BETWEEN ? AND ? ' +
            'GROUP BY dc.idMateriel', [startDate, endDate]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des ventes", error: error.message });
    }
});

/**
 *  Ajouter un DetailCommande
 */
router.post('/detailcommande', async (req, res) => {
    const { idCommande, idMateriel, quantite } = req.body;
    try {
        await pool.query('INSERT INTO DetailCommande (idCommande, idMateriel, quantite) VALUES (?, ?, ?)', [idCommande, idMateriel, quantite]);
        res.status(201).send({ message: 'Détail de commande ajouté avec succès' });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de l'ajout du détail de commande", error: error.message });
    }
});

/**
 * Modifier un DetailCommande
 */
router.patch('/detailcommande/:idCommande/:idMateriel', async (req, res) => {
    const { idCommande, idMateriel } = req.params;
    const { quantite } = req.body;
    try {
        await pool.query('UPDATE DetailCommande SET quantite = ? WHERE idCommande = ? AND idMateriel = ?', [quantite, idCommande, idMateriel]);
        res.status(200).send({ message: 'Détail de commande mis à jour avec succès' });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la mise à jour du détail de commande", error: error.message });
    }
});

/**
 * Modifier un DetailCommande
 */
router.delete('/detailcommande/:idCommande/:idMateriel', async (req, res) => {
    const { idCommande, idMateriel } = req.params;
    try {
        await pool.query('DELETE FROM DetailCommande WHERE idCommande = ? AND idMateriel = ?', [idCommande, idMateriel]);
        res.status(200).send({ message: 'Détail de commande supprimé avec succès' });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la suppression du détail de commande", error: error.message });
    }
});

/**
 *  Obtenir le prix total des ventes pour chaque article
 */
router.get('/materiels/total-ventes', async (req, res) => {
    try {
        const results = await pool.query(
            'SELECT m.idMateriel, m.libelle, SUM(dc.quantite) AS quantite_vendue, SUM(dc.quantite * m.prix) AS revenu_total FROM DetailCommande dc ' +
            'JOIN Materiel m ON dc.idMateriel = m.idMateriel ' +
            'GROUP BY m.idMateriel');
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération du total des ventes de chaque article", error: error.message });
    }
});



module.exports = router;
