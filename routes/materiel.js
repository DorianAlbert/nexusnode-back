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
