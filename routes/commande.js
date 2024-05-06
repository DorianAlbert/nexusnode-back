var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
/**
 * Afficher toutes les commandes
 */
/**
 * @openapi
 * /commande:
 *   get:
 *     tags:
 *       - Commande
 *     summary: Afficher toutes les commandes
 *     responses:
 *       200:
 *         description: Liste de toutes les commandes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                C.idCommande,
                C.nomFacture,
                C.cheminFacture,
                C.dateCommande,
                CONCAT(A.rue, ', ', A.ville, ', ', A.CDP, ', ', A.pays) AS AdresseLivraison,
                U.idUser,
                CONCAT(U.nom, ' ', U.prenom) AS NomClient,
                SUM(DC.quantite * M.prix) AS TotalHT,
                SUM(DC.quantite * M.prix) * 1.20 AS TotalTTC,
                GROUP_CONCAT(CONCAT(M.libelle, ' x ', DC.quantite) SEPARATOR ', ') AS DetailsProduits
            FROM Commande C
            JOIN Adresse A ON C.idAdresse = A.idAdresse
            JOIN Utilisateur U ON C.idUser = U.idUser
            JOIN DetailCommande DC ON C.idCommande = DC.idCommande
            JOIN Materiel M ON DC.idMateriel = M.idMateriel
            GROUP BY C.idCommande;
        `;
        const results = await pool.query(query);
        if (results.length === 0) {
            res.status(404).send({ message: 'Aucune commande trouvée.' });
        } else {
            res.status(200).send(results);
        }
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
/**
 * @openapi
 * /commande/{idUser}:
 *   get:
 *     tags:
 *       - Commande
 *     summary: Affiche toutes les commandes pour un utilisateur spécifique
 *     description: Récupère toutes les commandes associées à un utilisateur spécifique, en incluant des détails comme le nom complet de l'utilisateur, l'ID de la commande, le total des prix des produits commandés, la date de la commande, et le nom de la facture.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'utilisateur pour lequel récupérer les commandes
 *     responses:
 *       200:
 *         description: Une liste de toutes les commandes pour l'utilisateur spécifié
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommandeDetail'
 *       500:
 *         description: Erreur interne du serveur
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
/**
 * @openapi
 * /commande/date:
 *   get:
 *     tags:
 *       - Commande
 *     summary: Affiche toutes les commandes entre deux dates spécifiées
 *     description: Récupère toutes les commandes placées entre deux dates, en utilisant des paramètres de requête pour définir l'intervalle de dates.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de l'intervalle (format YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de l'intervalle (format YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Liste des commandes entre les dates spécifiées
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur interne du serveur
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
/**
 * @openapi
 * /commande/user/{idUser}/date:
 *   get:
 *     tags:
 *       - Commande
 *     summary: Affiche toutes les commandes d'un utilisateur spécifique entre deux dates
 *     description: Récupère toutes les commandes effectuées par un utilisateur spécifié entre deux dates fournies.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'utilisateur dont les commandes doivent être récupérées
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de l'intervalle (format YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de l'intervalle (format YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Liste des commandes de l'utilisateur spécifié entre les dates données
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur interne du serveur
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
});

/**
 * @openapi
 * /commande:
 *   post:
 *     tags:
 *       - Commande
 *     summary: Crée une nouvelle commande
 *     description: Enregistre une nouvelle commande dans la base de données avec les détails fournis, incluant les articles commandés, et génère une facture au format PDF.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateCommande:
 *                 type: string
 *                 format: date-time
 *                 description: La date à laquelle la commande est passée.
 *               nomFacture:
 *                 type: string
 *                 description: Le nom de la facture associée à la commande.
 *               cheminFacture:
 *                 type: string
 *                 description: Chemin d'accès où la facture sera enregistrée.
 *               idPaiement:
 *                 type: integer
 *                 description: Identifiant du paiement associé.
 *               idAdresse:
 *                 type: integer
 *                 description: Identifiant de l'adresse de livraison.
 *               idUser:
 *                 type: integer
 *                 description: Identifiant de l'utilisateur qui passe la commande.
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Identifiant du produit commandé.
 *                     quantite:
 *                       type: integer
 *                       description: Quantité du produit commandé.
 *     responses:
 *       201:
 *         description: Commande créée avec succès et retour de l'identifiant de la nouvelle commande.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idCommande:
 *                   type: integer
 *                   description: L'identifiant de la nouvelle commande créée.
 *       500:
 *         description: Erreur lors de la création de la commande
 */


router.post('/', async (req, res) => {
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
});

/**
 * Modifier une commande existante
 */
/**
 * @openapi
 * /commandes/{idCommande}:
 *   patch:
 *     tags:
 *       - Commande
 *     summary: Modifier une commande existante
 *     description: Met à jour les détails d'une commande existante dans la base de données.
 *     parameters:
 *       - in: path
 *         name: idCommande
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la commande à modifier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateCommande:
 *                 type: string
 *                 format: date-time
 *                 description: Nouvelle date de la commande.
 *               nomFacture:
 *                 type: string
 *                 description: Nouveau nom de la facture.
 *               cheminFacture:
 *                 type: string
 *                 description: Nouveau chemin de la facture sur le serveur.
 *               idPaiement:
 *                 type: integer
 *                 description: Identifiant du nouveau paiement lié à la commande.
 *               idAdresse:
 *                 type: integer
 *                 description: Identifiant de la nouvelle adresse de livraison.
 *               idUser:
 *                 type: integer
 *                 description: Identifiant de l'utilisateur associé à la commande.
 *     responses:
 *       200:
 *         description: Commande mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Commande mise à jour avec succès'
 *       500:
 *         description: Erreur lors de la mise à jour de la commande
 */

router.patch('/commandes/:idCommande', async (req, res) => {
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

/**
 * @openapi
 * /commandes/{idCommande}:
 *   delete:
 *     tags:
 *       - Commande
 *     summary: Supprime une commande spécifique
 *     description: Supprime une commande de la base de données en utilisant son identifiant.
 *     parameters:
 *       - in: path
 *         name: idCommande
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la commande à supprimer.
 *     responses:
 *       200:
 *         description: Commande supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Commande supprimée avec succès
 *       404:
 *         description: Commande non trouvée
 *       500:
 *         description: Erreur lors de la suppression de la commande
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
/**
 * @openapi
 * /commandes/{idCommande}
 *   get:
 *     tags:
 *       - Commande
 *     summary: Récupère tous les articles d'une commande spécifique
 *     description: Retourne les détails des articles associés à une commande donnée, y compris le libellé, la description, la quantité et le prix de chaque matériel.
 *     parameters:
 *       - in: path
 *         name: idCommande
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la commande pour laquelle les détails des matériaux sont demandés.
 *     responses:
 *       200:
 *         description: Liste des matériaux de la commande spécifiée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MaterielDetail'
 *       500:
 *         description: Erreur lors de la récupération des matériaux de la commande
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

/**
 * @openapi
 * /materiels/ventes/{startDate}/{endDate}:
 *   get:
 *     tags:
 *       - Matériel
 *     summary: Récupère les ventes de tous les matériaux entre deux dates
 *     description: Retourne les données des ventes pour tous les matériaux, incluant le libellé, la quantité vendue et le total des prix, filtrées entre deux dates spécifiées.
 *     parameters:
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de l'intervalle pour le rapport des ventes (format YYYY-MM-DD).
 *       - in: path
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de l'intervalle pour le rapport des ventes (format YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Résumé des ventes pour les matériaux entre les dates spécifiées
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MaterielVenteDetail'
 *       500:
 *         description: Erreur lors de la récupération des informations de vente
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

/**
 * @openapi
 * /detailcommande:
 *   post:
 *     tags:
 *       - DetailCommande
 *     summary: Ajoute un détail de commande
 *     description: Insère un nouveau détail de commande dans la base de données.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idCommande:
 *                 type: integer
 *                 description: ID de la commande associée
 *               idMateriel:
 *                 type: integer
 *                 description: ID du matériel commandé
 *               quantite:
 *                 type: integer
 *                 description: Quantité du matériel commandé
 *     responses:
 *       201:
 *         description: Détail de commande ajouté avec succès
 *       500:
 *         description: Erreur lors de l'ajout du détail de commande
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

/**
 * @openapi
 * /detailcommande/{idCommande}/{idMateriel}:
 *   patch:
 *     tags:
 *       - DetailCommande
 *     summary: Modifie un détail de commande existant
 *     description: Met à jour la quantité d'un matériel spécifique dans une commande.
 *     parameters:
 *       - in: path
 *         name: idCommande
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idMateriel
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantite:
 *                 type: integer
 *                 description: Nouvelle quantité du matériel commandé
 *     responses:
 *       200:
 *         description: Détail de commande mis à jour avec succès
 *       500:
 *         description: Erreur lors de la mise à jour du détail de commande
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

/**
 * @openapi
 * /detailcommande/{idCommande}/{idMateriel}:
 *   delete:
 *     tags:
 *       - DetailCommande
 *     summary: Supprime un détail de commande
 *     description: Supprime un détail spécifique d'une commande de la base de données.
 *     parameters:
 *       - in: path
 *         name: idCommande
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idMateriel
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail de commande supprimé avec succès
 *       500:
 *         description: Erreur lors de la suppression du détail de commande
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

/**
 * @openapi
 * /total-ventes/{year}:
 *   get:
 *     tags:
 *       - Rapports
 *     summary: Obtient le total des ventes pour chaque article durant une année spécifique
 *     description: Renvoie la quantité totale vendue et le revenu total pour chaque article durant l'année spécifiée.
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Données des ventes récupérées avec succès
 *       500:
 *         description: Erreur lors de la récupération des données
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

/**
 * @openapi
 * /totalCommande/{year}:
 *   get:
 *     tags:
 *       - Rapports
 *     summary: Obtient le nombre total de commandes passées durant une année spécifique
 *     description: Renvoie le nombre total de commandes passées durant l'année spécifiée.
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nombre total de commandes récupéré avec succès
 *       500:
 *         description: Erreur lors de la récupération des données
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
