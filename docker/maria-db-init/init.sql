CREATE TABLE Utilisateur(
                            idUser INT AUTO_INCREMENT,
                            nom VARCHAR(250),
                            prenom VARCHAR(255),
                            mail VARCHAR(50),
                            password VARCHAR(255),
                            role INT,
                            PRIMARY KEY(idUser)
);

CREATE TABLE Adresse(
                        idAdresse INT AUTO_INCREMENT,
                        rue VARCHAR(50),
                        ville VARCHAR(50),
                        CDP VARCHAR(50),
                        pays VARCHAR(50),
                        idUser INT NOT NULL,
                        PRIMARY KEY(idAdresse),
                        FOREIGN KEY(idUser) REFERENCES Utilisateur(idUser)
);

CREATE TABLE Paiement(
                         idPaiement INT AUTO_INCREMENT,
                         datePaiement DATETIME,
                         Etat VARCHAR(50),
                         PRIMARY KEY(idPaiement)
);

CREATE TABLE Categorie(
                          idCategorie INT AUTO_INCREMENT,
                          libelle VARCHAR(50),
                          PRIMARY KEY(idCategorie)
);

CREATE TABLE Commande(
                         idCommande INT AUTO_INCREMENT,
                         dateCommande DATETIME,
                         nomFacture VARCHAR(255),
                         cheminFacture VARCHAR(255),
                         idPaiement INT NOT NULL,
                         idAdresse INT NOT NULL,
                         idUser INT NOT NULL,
                         PRIMARY KEY(idCommande),
                         FOREIGN KEY(idPaiement) REFERENCES Paiement(idPaiement),
                         FOREIGN KEY(idAdresse) REFERENCES Adresse(idAdresse),
                         FOREIGN KEY(idUser) REFERENCES Utilisateur(idUser)
);

CREATE TABLE Matériel(
                         idMateriel INT AUTO_INCREMENT,
                         libelle VARCHAR(255),
                         description VARCHAR(255),
                         prix DOUBLE,
                         dateSortie DATE,
                         idCategorie INT NOT NULL,
                         PRIMARY KEY(idMateriel),
                         FOREIGN KEY(idCategorie) REFERENCES Categorie(idCategorie)
);

CREATE TABLE Image(
                      idImage INT AUTO_INCREMENT,
                      emplacement VARCHAR(255),
                      idMateriel INT,
                      PRIMARY KEY(idImage),
                      FOREIGN KEY(idMateriel) REFERENCES Matériel(idMateriel)
);

CREATE TABLE DetailCommande(
                               idCommande INT,
                               idMateriel INT,
                               quantite INT,
                               PRIMARY KEY(idCommande, idMateriel),
                               FOREIGN KEY(idCommande) REFERENCES Commande(idCommande),
                               FOREIGN KEY(idMateriel) REFERENCES Matériel(idMateriel)
);

-- Utilisateurs
INSERT INTO Utilisateur (nom, prenom, mail, password, role) VALUES
                                                                ('Doe', 'John', 'john.doe@example.com', 'motdepasse123', 1),
                                                                ('Smith', 'Alice', 'alice.smith@example.com', 'password456', 2),
                                                                ('Brown', 'Bob', 'bob.brown@example.com', 'securepass789', 2);
-- Adresses
INSERT INTO Adresse (rue, ville, CDP, pays, idUser) VALUES
                                                        ('123 Main Street', 'Anytown', '12345', 'USA', 1),
                                                        ('456 Oak Avenue', 'Sometown', '54321', 'USA', 2),
                                                        ('789 Elm Street', 'Anycity', '67890', 'USA', 3);
-- Paiements
INSERT INTO Paiement (datePaiement, Etat) VALUES
                                              ('2024-04-01 10:30:00', 'Réussi'),
                                              ('2024-04-02 11:45:00', 'Échoué'),
                                              ('2024-04-03 12:00:00', 'En cours');
-- Catégories
INSERT INTO Categorie (libelle) VALUES
                                    ('Électronique'),
                                    ('Vêtements'),
                                    ('Livres');
-- Commandes
INSERT INTO Commande (dateCommande, nomFacture, cheminFacture, idPaiement, idAdresse, idUser) VALUES
                                                                                                  ('2024-04-01 11:00:00', 'Facture1', '/chemin/facture1.pdf', 1, 1, 1),
                                                                                                  ('2024-04-02 12:00:00', 'Facture2', '/chemin/facture2.pdf', 2, 2, 2),
                                                                                                  ('2024-04-03 13:00:00', 'Facture3', '/chemin/facture3.pdf', 3, 3, 3);
-- Matériels
INSERT INTO Matériel (libelle, description, prix, dateSortie, idCategorie) VALUES
                                                                               ('Smartphone', 'Téléphone intelligent', 499.99, '2024-01-01', 1),
                                                                               ('T-shirt', 'T-shirt noir', 19.99, '2024-02-01', 2),
                                                                               ('Roman', 'Roman policier', 12.99, '2024-03-01', 3);
-- Images
INSERT INTO Image (emplacement, idMateriel) VALUES
                                                ('/chemin/image1.jpg', 1),
                                                ('/chemin/image2.jpg', 2),
                                                ('/chemin/image3.jpg', 3);
-- Détails des commandes
INSERT INTO DetailCommande (idCommande, idMateriel, quantite) VALUES
                                                                  (1, 1, 1),
                                                                  (2, 2, 2),
                                                                  (3, 3, 3);
