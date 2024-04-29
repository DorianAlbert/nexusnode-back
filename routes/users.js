var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
var pool = require('../middleware/database').databaseConnection
const jwt = require('jsonwebtoken');

/**
 * EndPoint pour créer un utilistateur a partir de ces infos ainsi que son Role
 * 1= Client
 * 2= Admin
 * 3= Support
 */
router.post('/sign-up', async (req, res) => {
  console.log(req.body)
  try {
    const { nom, prenom, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const result = await pool.query('INSERT INTO Utilisateur (nom, prenom, mail, password, role) VALUES (?, ?, ?, ?, ?)', [nom, prenom, email, hashedPassword, role]);
    res.status(201).send({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).send({ message: "Erreur lors de la création de l'utilisateur", error: error.message });
  }
});
/**
 * End Point pour se connecter avec un mail et un mot de passe on renvoie un tokken signé de 24H
 */
router.post('/sign-in', async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const rows = await pool.query('SELECT idUser,nom, prenom, mail, password, role FROM Utilisateur WHERE mail = ?', [email]);
    //console.log(rows)

    if (rows.length > 0) {
      const user = rows[0];
      const passwordIsValid = await bcrypt.compareSync(password, user.password);

      if (passwordIsValid) {
        const dataUser = {
          id: user.idUser,
          role: user.role,
          nom: user.nom,
          mail: user.mail,
          prenom: user.prenom
        }

        const token = jwt.sign({ id: user.idUser, role: user.role }, 'secret', { expiresIn: 86400 });
        res.status(200).send({ auth: true, token: token, info: dataUser });
      } else {
        return res.status(401).send({ auth: false, token: null, message: "Mot de passe invalide." });
      }
    } else {
      return res.status(404).send("Utilisateur non trouvé.");
    }
  } catch (error) {
    console.error("Erreur lors de la tentative de connexion :", error);
    res.status(500).send("Erreur lors de la connexion.");
  }
});


router.get('/:userId'), async (req, res) => {
  const {userId} = req.param
  const results = await pool.query('SELECT nom, prenom, mail  FROM Utilisateur WHERE idUser = ?', [userId]);
  res.status(200).send(results);
}

module.exports = router;
