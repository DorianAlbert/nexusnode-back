var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
/**
 * Afficher toutes les commandes
 */
router.get('/', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM Commande');
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la récupération des commandes', error: error.message });
    }
});
router.get('/all', async (req, res) => {
    try {
        const results = await pool.query('SELECT \n' +
            '    CONCAT(u.nom, \' \', u.prenom) AS NomComplet,\n' +
            '    c.idCommande,\n' +
            '    SUM(dc.quantite * m.prix) AS PrixTotal,\n' +
            '    c.dateCommande, \n' +
            '    c.nomFacture\n' +
            'FROM Commande c\n' +
            'JOIN Utilisateur u ON c.idUser = u.idUser\n' +
            'JOIN DetailCommande dc ON c.idCommande = dc.idCommande\n' +
            'JOIN Materiel m ON dc.idMateriel = m.idMateriel\n' +
            'GROUP BY c.idCommande, c.dateCommande, c.nomFacture;\n');
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la récupération des commandes', error: error.message });
    }
});

/**
 * Afficher toutes les commandes d'un utilisateur spécifique
 */
router.get('/:idUser', async (req, res) => {
    const idUser = req.params.idUser;  // Correction ici pour extraire correctement l'ID utilisateur.
    try {
        const results = await pool.query(
            `SELECT 
                CONCAT(u.nom, ' ', u.prenom) AS NomComplet,
                c.idCommande,
                SUM(dc.quantite * m.prix) AS PrixTotal,
                c.dateCommande, 
                c.nomFacture
            FROM Commande c
            JOIN Utilisateur u ON c.idUser = u.idUser
            JOIN DetailCommande dc ON c.idCommande = dc.idCommande
            JOIN Materiel m ON dc.idMateriel = m.idMateriel
            WHERE u.idUser = ?
            GROUP BY c.idCommande, c.dateCommande, c.nomFacture`,
            [idUser]  // Passage de l'ID utilisateur comme paramètre dans la requête
        );
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la récupération des commandes', error: error.message });
    }
});


/**
 * Afficher toutes les commandes entre deux dates
 */
router.get('/date', async (req, res) => {
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
router.get('/user/:idUser/date', async (req, res) => {
    const { idUser } = req.params;
    const { startDate, endDate } = req.query;
    try {
        const results = await pool.query('SELECT * FROM Commande WHERE idUser = ? AND dateCommande BETWEEN ? AND ?', [idUser, startDate, endDate]);
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des commandes de l'utilisateur par dates", error: error.message });
    }
});router.post('/', async (req, res) => {
    const { dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser, cartItems } = req.body;

    try {
        // Insérer la commande principale dans la table Commande
        const result = await pool.query('INSERT INTO Commande (dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser) VALUES (?, ?, ?, ?, ?, ?)', [dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser]);
        let newId = result.insertId.toString();  // Convertir BigInt en String pour éviter des problèmes de sérialisation JSON

        // Insérer chaque produit dans DetailCommande
        for (const { id, quantite } of cartItems) {
            await pool.query('INSERT INTO DetailCommande (idCommande, idMateriel, quantite) VALUES (?, ?, ?)', [newId, id, quantite]);
        }

        // Générer la facture au format PDF
        const doc = new PDFDocument();
        const fileName = `${nomFacture}.pdf`;
        const filePath = path.join(__dirname, '..', 'public', 'Facture', fileName);
        doc.pipe(fs.createWriteStream(filePath));

        // Mise en page de la facture
        doc.font('Helvetica-Bold')
            .fontSize(22)
            .text('NexusNode', { align: 'center' })
            .moveDown(0.5);

        doc.fontSize(18)
            .text('FACTURE', { align: 'center' })
            .moveDown(1);

        doc.fontSize(12)
            .text(`Date: ${dateCommande}`, { continued: true })
            .text(`Facture #${nomFacture}`, { align: 'right' });

        // Informations du client
        const userData = await pool.query('SELECT nom, prenom FROM Utilisateur WHERE idUser = ?', [idUser]);
        const { nom, prenom } = userData[0];
        doc.text(`Facturé à: ${prenom} ${nom}`)
            .moveDown(1);

        // En-tête du tableau
        // Configuration de l'en-tête du tableau
        doc.strokeColor("#aaaaaa")
            .lineWidth(1)
            .rect(50, doc.y, 500, 20) // Dessine un rectangle pour l'en-tête
            .fillAndStroke("#eeeeee", "#aaaaaa");

// Définir la position y pour les textes de l'en-tête pour qu'ils soient alignés dans le rectangle
        const headerPositionY = doc.y + 6; // Ajoute un petit offset pour centrer le texte verticalement dans le rectangle

// Textes de l'en-tête sur la même ligne
        doc.font('Helvetica')
            .fontSize(10)
            .fillColor('black')
            .text('Produit', 60, headerPositionY, { width: 220, align: 'left' })
            .text('Quantité', 280, headerPositionY, { width: 90, align: 'right' })
            .text('Prix unitaire', 370, headerPositionY, { width: 90, align: 'right' })
            .text('Total', 450, headerPositionY, { width: 90, align: 'right' });

// Déplace le curseur sous le rectangle de l'en-tête pour commencer les entrées de produits
        doc.moveDown(1.5);


        // Détails du produit et calcul des totaux
        let totalHT = 0;
        for (const { id, quantite } of cartItems) {
            const productData = await pool.query('SELECT libelle, prix FROM Materiel WHERE idMateriel = ?', [id]);
            const { libelle, prix } = productData[0];
            let subtotal = prix * quantite;
            totalHT += subtotal;

            doc.text(libelle, 60, doc.y, { width: 220, align: 'left' })
                .text(quantite.toString(), 280, doc.y, { width: 90, align: 'right' })
                .text(`${prix.toFixed(2)}€`, 370, doc.y, { width: 90, align: 'right' })
                .text(`${subtotal.toFixed(2)}€`, 460, doc.y, { width: 90, align: 'right' })
                .moveDown(0.2);
        }

        // Affichage du total
        doc.font('Helvetica-Bold')
            .fontSize(12)
            .text(`Total TTC: ${totalHT.toFixed(2)}€`, 410, doc.y, { align: 'right' });

        doc.end();

        // Mettre à jour le chemin de la facture dans la base de données
        await pool.query('UPDATE Commande SET cheminFacture = ? WHERE idCommande = ?', [filePath, newId]);

        // Envoyer la réponse avec l'ID de la commande
        res.status(201).send({ idCommande: newId });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la commande: ", error.message);
        res.status(500).send({ message: "Erreur lors de l'ajout de la commande", error: error.message });
    }
});/**
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
 * Récupérer tous les Articles d'une commande par l'ID de la commande
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
 * Ajouter un DetailCommande
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
 * Supprimer un DetailCommande
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
 * Obtenir le prix total des ventes pour chaque article
 */
router.get('/total-ventes/:year', async (req, res) => {
    const { year } = req.params;
    try {
        const results = await pool.query(
            `SELECT
                 'Total' AS libelle_produit,
                 SUM(dc.quantite) AS quantite_totale,
                 SUM(dc.quantite * m.prix) AS revenu_total
             FROM DetailCommande dc
                      JOIN Materiel m ON dc.idMateriel = m.idMateriel
                      JOIN Commande c ON dc.idCommande = c.idCommande
             WHERE YEAR(c.dateCommande) = ?

             UNION

             SELECT
                 m.libelle AS libelle_produit,
                 SUM(dc.quantite) AS quantite_totale,
                 SUM(dc.quantite * m.prix) AS revenu_total
             FROM DetailCommande dc
                      JOIN Materiel m ON dc.idMateriel = m.idMateriel
                      JOIN Commande c ON dc.idCommande = c.idCommande
             WHERE YEAR(c.dateCommande) = ?
             GROUP BY m.idMateriel`,
            [year, year]
        );
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send({ message: `Erreur lors de la récupération du total des ventes de chaque article pour l'année ${year}`, error: error.message });
    }
});


/**
 * Obtenir le nombre total de commandes
 */
router.get('/totalCommande/:year', async (req, res) => {
    const{year}= req.params
    try {
        const results = await pool.query(`SELECT COUNT(*) as nbCommande FROM Commande WHERE dateCommande BETWEEN \'${year}-01-01\' AND \'${year}-12-31\';\n`);
        const nbCommande = results[0].nbCommande.toString(); // Convertir le BigInt en chaîne de caractères
        res.status(200).send({ nbCommande: nbCommande });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération du total des commandes", error: error.message });
    }
});


module.exports = router;
