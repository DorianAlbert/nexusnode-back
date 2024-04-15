# Documentation des Routes

Ce document fournit des informations sur chaque route de l'API, y compris les paramètres de requête, de corps et les réponses attendues.

## Utilisateurs

### POST /sign-up

Crée un nouvel utilisateur avec les informations fournies.

**Paramètres du corps (JSON)** :
- `nom` : Nom de l'utilisateur
- `prenom` : Prénom de l'utilisateur
- `email` : Adresse e-mail de l'utilisateur
- `password` : Mot de passe de l'utilisateur (sera hashé)
- `role` : Rôle de l'utilisateur (1=Client, 2=Admin, 3=Support)

**Réponse** :
- Code 201 : Utilisateur créé avec succès
- Code 500 : Erreur lors de la création de l'utilisateur

### POST /sign-in

Connecte un utilisateur avec son adresse e-mail et son mot de passe, renvoyant un token JWT.

**Paramètres du corps (JSON)** :
- `email` : Adresse e-mail de l'utilisateur
- `password` : Mot de passe de l'utilisateur

**Réponse** :
- Code 200 : Authentification réussie, renvoie un token JWT
- Code 401 : Mot de passe invalide
- Code 404 : Utilisateur non trouvé
- Code 500 : Erreur lors de la tentative de connexion

## Adresse

### GET /user/:userId

Affiche toutes les adresses d'un utilisateur spécifique.

**Paramètres de la requête** :
- `userId` : ID de l'utilisateur

**Réponse** :
- Liste des adresses de l'utilisateur

### POST /

Crée une nouvelle adresse pour un utilisateur.

**Paramètres du corps (JSON)** :
- `rue` : Rue de l'adresse
- `ville` : Ville de l'adresse
- `CDP` : Code postal de l'adresse
- `pays` : Pays de l'adresse
- `idUser` : ID de l'utilisateur associé à l'adresse

**Réponse** :
- Code 201 : Adresse créée avec succès

### PATCH /:idAdresse

Modifie une adresse existante.

**Paramètres de la requête** :
- `idAdresse` : ID de l'adresse à modifier

**Paramètres du corps (JSON)** :
- `rue` : Nouvelle rue de l'adresse
- `ville` : Nouvelle ville de l'adresse
- `CDP` : Nouveau code postal de l'adresse
- `pays` : Nouveau pays de l'adresse
- `idUser` : Nouvel ID de l'utilisateur associé à l'adresse

**Réponse** :
- Code 200 : Adresse mise à jour avec succès

### DELETE /:idAdresse

Supprime une adresse.

**Paramètres de la requête** :
- `idAdresse` : ID de l'adresse à supprimer

**Réponse** :
- Code 200 : Adresse supprimée avec succès

### GET /:idAdresse

Affiche une adresse en fonction de son ID.

**Paramètres de la requête** :
- `idAdresse` : ID de l'adresse à afficher

**Réponse** :
- Détails de l'adresse demandée

## Commandes

### GET /

Affiche toutes les commandes.

**Réponse** :
- Liste de toutes les commandes

### GET /user/:idUser

Affiche toutes les commandes d'un utilisateur spécifique.

**Paramètres de la requête** :
- `idUser` : ID de l'utilisateur

**Réponse** :
- Liste des commandes de l'utilisateur

### GET /date

Affiche toutes les commandes entre deux dates spécifiques.

**Paramètres de la requête** :
- `startDate` : Date de début (format YYYY-MM-DD)
- `endDate` : Date de fin (format YYYY-MM-DD)

**Réponse** :
- Liste des commandes entre les dates spécifiées

### GET /user/:idUser/date

Affiche toutes les commandes d'un utilisateur entre deux dates spécifiques.

**Paramètres de la requête** :
- `idUser` : ID de l'utilisateur
- `startDate` : Date de début (format YYYY-MM-DD)
- `endDate` : Date de fin (format YYYY-MM-DD)

**Réponse** :
- Liste des commandes de l'utilisateur entre les dates spécifiées

### POST /

Ajoute une nouvelle commande.

**Paramètres du corps (JSON)** :
- `dateCommande` : Date de la commande (format YYYY-MM-DD)
- `nomFacture` : Nom de la facture
- `cheminFacture` : Chemin vers la facture
- `idPaiement` : ID du mode de paiement
- `idAdresse` : ID de l'adresse de livraison
- `idUser` : ID de l'utilisateur passant la commande

**Réponse** :
- Code 201 : Commande ajoutée avec succès

### PATCH /:idCommande

Modifie une commande existante.

**Paramètres de la requête** :
- `idCommande` : ID de la commande à modifier

**Paramètres du corps (JSON)** :
- `dateCommande` : Nouvelle date de la commande (format YYYY-MM-DD)
- `nomFacture` : Nouveau nom de la facture
- `cheminFacture` : Nouveau chemin vers la facture
- `idPaiement` : Nouvel ID du mode de paiement
- `idAdresse` : Nouvel ID de l'adresse de livraison
- `idUser` : Nouvel ID de l'utilisateur passant la commande

**Réponse** :
- Code 200 : Commande mise à jour avec succès

### DELETE /:idCommande

Supprime une commande.

**Paramètres de la requête** :
- `idCommande` : ID de la commande à supprimer

**Réponse** :
- Code 200 : Commande supprimée avec succès

### GET /:idCommande/materiels

Affiche tous les articles d'une commande en fonction de son ID.

**Paramètres de la requête** :
- `idCommande` : ID de la commande

**Réponse** :
- Liste des articles de la commande

### GET /materiels/ventes

Obtient les libellés de chaque article, la quantité vendue entre deux dates et le prix total.

**Paramètres de la requête** :
- `startDate` : Date de début (format YYYY-MM-DD)
- `endDate` : Date de fin (format YYYY-MM-DD)

**Réponse** :
- Détails des ventes pour chaque article

