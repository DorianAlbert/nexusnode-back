var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
var pool = require('../middleware/database').databaseConnection
const jwt = require('jsonwebtoken');

/**
 * @openapi
 * /users/sign-up:
 *   post:
 *     tags:
 *       - Utilisateur
 *     summary: Crée un utilisateur
 *     description: Inscription d'un nouvel utilisateur avec son rôle.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: integer
 *                 description: "1 pour Client, 2 pour Admin, 3 pour Support"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       500:
 *         description: Erreur lors de la création de l'utilisateur
 */
router.post('/sign-up', async (req, res) => {
  const { nom, prenom, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query('INSERT INTO Utilisateur (nom, prenom, mail, password, role) VALUES (?, ?, ?, ?, ?)', [nom, prenom, email, hashedPassword, role]);
    res.status(201).send({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).send({ message: "Erreur lors de la création de l'utilisateur", error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('select * from Utilisateur ');
    res.status(201).send({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    res.status(500).send({ message: "Erreur lors de la création de l'utilisateur", error: error.message });
  }
});
/**
 * @openapi
 * /users/sign-in:
 *   post:
 *     tags:
 *       - Utilisateur
 *     summary: Connexion d'un utilisateur
 *     description: Connecte un utilisateur et renvoie un token JWT valide pour 24 heures.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Connexion réussie, token retourné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 info:
 *                   $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: Mot de passe invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur lors de la connexion
 */
router.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;
  try {
    const rows = await pool.query('SELECT idUser, nom, prenom, mail, password, role FROM Utilisateur WHERE mail = ?', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (passwordIsValid) {
        const token = jwt.sign({ id: user.idUser, role: user.role }, 'secret', { expiresIn: 86400 });
        res.status(200).send({ auth: true, token: token, info: { id: user.idUser, role: user.role, nom: user.nom, prenom: user.prenom, mail: user.mail } });
      } else {
        res.status(401).send({ auth: false, token: null, message: "Mot de passe invalide." });
      }
    } else {
      res.status(404).send("Utilisateur non trouvé.");
    }
  } catch (error) {
    console.error("Erreur lors de la tentative de connexion :", error);
    res.status(500).send("Erreur lors de la connexion.");
  }
});

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Utilisateur
 *     summary: Récupère les détails d'un utilisateur spécifique
 *     description: Renvoie les informations détaillées d'un utilisateur spécifié par son ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur récupérés avec succès
 *       500:
 *         description: Erreur lors de la récupération des informations de l'utilisateur
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const results = await pool.query('SELECT nom, prenom, mail FROM Utilisateur WHERE idUser = ?', [userId]);
    res.status(200).send(results);
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'utilisateur:", error);
    res.status(500).send({ message: "Erreur lors de la récupération des informations de l'utilisateur", error: error.message });
  }
});

module.exports = router;
