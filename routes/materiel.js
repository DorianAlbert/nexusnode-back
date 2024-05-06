var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/materiels'); // Chemin où stocker les images
    },
    filename: (req, file, cb) => {
        // Récupérer l'ID du produit depuis les paramètres de la requête
        const idMateriel = req.params.idMateriel;
        // Utiliser l'ID du produit dans le nom du fichier image
        const imageName = `${idMateriel}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, imageName);
    }
});
const upload = multer({storage: storage });


/**
 * Récupere la liste de tout les Matériels présent dans la base de donnée
 */

/**
 * @openapi
 * /materiels:
 *   get:
 *     tags:
 *       - Matériel
 *     summary: Récupère la liste de tous les matériaux
 *     description: Renvoie une liste de tous les matériaux disponibles dans la base de données, incluant leurs détails.
 *     responses:
 *       200:
 *         description: Liste de tous les matériaux récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Materiel'
 *       500:
 *         description: Erreur serveur
 */

router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT Materiel.libelle AS materiel_libelle, Materiel.idMateriel, \n' +
            '       Materiel.description, \n' +
            '       Materiel.prix, \n' +
            '       Materiel.dateSortie, \n' +
            '       Materiel.PATH_Image, \n' +
            '       Categorie.libelle AS categorie_libelle, \n' +
            '       Categorie.idCategorie AS id_Categorie \n' +
            'FROM Materiel, Categorie \n' +
            'WHERE Materiel.idCategorie = Categorie.idCategorie;\n');
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        res.status(500).send({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
});
/**
 * Récupere la liste des Matériels en fonction d'une catégorie selectionné
 */

/**
 * @openapi
 * /materiels/{idCategorie}:
 *   get:
 *     tags:
 *       - Matériel
 *     summary: Récupère les matériaux par catégorie
 *     description: Renvoie tous les matériaux associés à une catégorie spécifique.
 *     parameters:
 *       - in: path
 *         name: idCategorie
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de la catégorie
 *     responses:
 *       200:
 *         description: Liste des matériaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Materiel'
 *       500:
 *         description: Erreur serveur
 */

router.get('/:idCategorie', async (req, res, next) => {
    const { idCategorie } = req.params;

    try {
        const result = await pool.query('SELECT M.*, C.idCategorie AS categorieId, C.libelle AS categorieNom FROM Materiel M, Categorie C WHERE M.idCategorie = C.idCategorie AND M.idCategorie = ?', [idCategorie]);
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        res.status(500).send({ message: "Erreur lors de la récupération des catégories", error: error.message });
    }
});

/**
 * Ajoute un nouveau Matériel dans la base de donnée
 * libelle, description, prix, dateSortie, idCategorie
 */

/**
 * @openapi
 * /materiels:
 *   post:
 *     tags:
 *       - Matériel
 *     summary: Ajoute un nouveau matériel
 *     description: Ajoute un nouveau matériel dans la base de données avec les détails fournis, y compris une image.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *               description:
 *                 type: string
 *               prix:
 *                 type: number
 *                 format: float
 *               dateSortie:
 *                 type: string
 *                 format: date
 *               idCategorie:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Matériel ajouté avec succès
 *       400:
 *         description: Données d'entrée invalides
 *       500:
 *         description: Erreur serveur
 */


router.post('/', upload.single('image'), async (req, res) => {
    const { libelle, description, prix, dateSortie, idCategorie } = req.body;
    const image = req.file;

    try {
        const parsedPrix = parseFloat(prix);
        if (isNaN(parsedPrix)) {
            return res.status(400).send({ message: "Le prix est invalide" });
        }

        // Convertir la date en format YYYY-MM-DD
        const formattedDate = new Date(dateSortie).toISOString().split('T')[0];

        let imagePath = null;
        if (image) {
            imagePath = `images/materiels/${Date.now()}-${image.originalname}`; // ou .jpg, selon votre format d'image
            // Déplacez l'image téléchargée vers le répertoire public
            await fs.promises.rename(image.path, path.join(__dirname, '..', 'public', imagePath));
        }

        const result = await pool.query('INSERT INTO Materiel (libelle, description, prix, dateSortie, idCategorie, PATH_Image) VALUES (?, ?, ?, ?, ?, ?)', [libelle, description, parsedPrix, formattedDate, idCategorie, imagePath]);

        res.status(200).send({ message: 'Produit ajouté avec succès' });
    } catch (error) {
        console.error("Erreur lors de l'ajout du produit:", error);
        res.status(500).send({ message: "Erreur lors de l'ajout du produit", error: error.message });
    }
});
/**
 * Modifie un produit selon sa catégorie
 */
/**
 * @openapi
 * /materiels/{idMateriel}:
 *   patch:
 *     tags:
 *       - Matériel
 *     summary: Modifie un matériel existant
 *     description: Met à jour les détails d'un matériel spécifique y compris la possibilité de changer l'image.
 *     parameters:
 *       - in: path
 *         name: idMateriel
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *               description:
 *                 type: string
 *               prix:
 *                 type: number
 *                 format: float
 *               dateSortie:
 *                 type: string
 *                 format: date
 *               idCategorie:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Matériel mis à jour avec succès
 *       400:
 *         description: Données d'entrée invalides
 *       500:
 *         description: Erreur serveur
 */

router.patch('/:idMateriel', upload.single('image'), async (req, res) => {
    const { idMateriel } = req.params;
    console.log(req.body);
    const { libelle, description, prix, dateSortie, idCategorie } = req.body;
    const image = req.file;

    try {
        const parsedPrix = parseFloat(prix);
        if (isNaN(parsedPrix)) {
            return res.status(400).send({ message: "Le prix est invalide" });
        }

        let imagePath = null;
        if (image) {
            imagePath = `/images/materiels/${image.filename}`;
        }

        // Convertir la date en format YYYY-MM-DD
        const formattedDate = new Date(dateSortie).toISOString().split('T')[0];

        const result = await pool.query('UPDATE Materiel SET libelle=?, description=?, prix=?, dateSortie=?, idCategorie=?, PATH_Image=? WHERE idMateriel=?', [libelle, description, parsedPrix, formattedDate, idCategorie, imagePath, idMateriel]);

        res.status(200).send({ message: 'Produit mis à jour avec succès' });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du produit:", error);
        res.status(500).send({ message: "Erreur lors de la mise à jour du produit", error: error.message });
    }
});


/**
 * Supprime un matériel en fonction de son ID
 */

/**
 * @openapi
 * /materiels/{idMateriel}:
 *   delete:
 *     tags:
 *       - Matériel
 *     summary: Supprime un matériel
 *     description: Supprime un matériel de la base de données si celui-ci n'est pas lié à une commande.
 *     parameters:
 *       - in: path
 *         name: idMateriel
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matériel supprimé avec succès
 *       404:
 *         description: Matériel non trouvé
 *       500:
 *         description: Erreur serveur
 */

router.delete('/:idMateriel', async (req, res) => {
    const { idMateriel } = req.params;
    try {
        const contentCommande = await pool.query('select * from DetailCommande where idMateriel = ?', [idMateriel]);
        console.log(contentCommande.length, contentCommande)
        if(contentCommande.length !== 0){
            res.send({ message: 'Impossible de supprimer un produit lié à une ou plusieurs commandes'});
        }else{
            const result = await pool.query('DELETE FROM Materiel WHERE idMateriel = ?', [idMateriel]);
            if (result.affectedRows) {
                res.send({ message: 'Matériel supprimé avec succès' });
            } else {
                res.status(404).send({ message: 'Matériel non trouvé' });
            }


        }

    } catch (error) {
        console.error("Erreur lors de la suppression du matériel:", error);
        res.status(500).send({ message: "Erreur lors de la suppression du matériel", error: error.message });
    }
});
/**
 * Permet la recherche de un ou plusieurs Matériel en fonctions d'un chaine de caractère saisit
 */

/**
 * @openapi
 * /materiels/recherche:
 *   post:
 *     tags:
 *       - Matériel
 *     summary: Recherche de matériel
 *     description: Recherche les matériaux qui correspondent à une chaîne de caractères fournie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchString:
 *                 type: string
 *     responses:
 *       200:
 *         description: Résultats de la recherche retournés avec succès
 *       404:
 *         description: Aucun matériel trouvé
 *       500:
 *         description: Erreur serveur
 */

router.post('/recherche', async (req, res) => {
    const { searchString } = req.body;
    if (!searchString) {
        return res.status(400).send({ message: "La chaîne de recherche est vide." });
    }
    try {
        const likeString = `%${searchString}%`;
        const results = await pool.query('SELECT * FROM Materiel WHERE libelle LIKE ?', [likeString]);
        if (results.length === 0) {
            return res.status(404).send({ message: "Aucun matériel trouvé avec cette chaîne de caractères." });
        }
        res.status(200).send(results);
    } catch (error) {
        console.error("Erreur lors de la recherche de matériel:", error);
        res.status(500).send({ message: "Erreur lors de la recherche de matériel", error: error.message });
    }
});

module.exports = router;
