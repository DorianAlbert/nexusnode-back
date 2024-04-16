var express = require('express');
var router = express.Router();
var pool = require('../middleware/database').databaseConnection

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
router.post('/', async (req, res) => {
    const { libelle, description, prix, dateSortie, idCategorie, Image } = req.body;
    console.log(libelle, description, prix, dateSortie, idCategorie, Image);
    try {
        // Convertir `prix` en nombre flottant pour s'assurer que ce n'est pas un BigInt
        const parsedPrix = parseFloat(prix);
        if (isNaN(parsedPrix)) {
            return res.status(400).send({ message: "Le prix est invalide" });
        }
        const result = await pool.query('INSERT INTO Materiel (libelle, description, prix, dateSortie, idCategorie, PATH_Image) VALUES (?, ?, ?, ?, ?, ?)', [libelle, description, parsedPrix, dateSortie, idCategorie, Image]);
        const insertIdAsString = result.insertId.toString();
        res.status(201).send({ message: 'Matériel ajouté avec succès', idMateriel: insertIdAsString });
    } catch (error) {z
        console.error("Erreur lors de l'ajout du matériel:", error);
        res.status(500).send({ message: "Erreur lors de l'ajout du matériel", error: error.message });
    }
});
/**
 * Modifie un Matériel dans la Base de donnée
 * IdMateriel dans la requete -->    PATCH->  http://localhost:3000/materiel/3
 * libelle, description, prix, dateSortie, idCategorie
 */
router.patch('/:idMateriel', async (req, res) => {
    const { idMateriel } = req.params;
    const { libelle, description, prix, dateSortie, idCategorie , image } = req.body;
    try {
        const result = await pool.query('UPDATE Materiel SET libelle = ?, description = ?, prix = ?, dateSortie = ?, idCategorie = ? , PATH_Image = ? WHERE idMateriel = ?', [libelle, description, prix, dateSortie, idCategorie,image, idMateriel ]);
        if (result.affectedRows) {
            res.send({ message: 'Matériel mis à jour avec succès' });
        } else {
            res.status(404).send({ message: 'Matériel non trouvé' });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du matériel:", error);
        res.status(500).send({ message: "Erreur lors de la mise à jour du matériel", error: error.message });
    }
});
/**
 * Supprime un matériel en fonction de son ID
 */
router.delete('/:idMateriel', async (req, res) => {
    const { idMateriel } = req.params;
    try {
        const result = await pool.query('DELETE FROM Materiel WHERE idMateriel = ?', [idMateriel]);
        if (result.affectedRows) {
            res.send({ message: 'Matériel supprimé avec succès' });
        } else {
            res.status(404).send({ message: 'Matériel non trouvé' });
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

