-- suppression des tables si elles existent
DROP
  TABLE IF EXISTS services CASCADE;
DROP
  TABLE IF EXISTS services_big CASCADE;
DROP
  TABLE IF EXISTS employes CASCADE;
DROP
  TABLE IF EXISTS employes_big CASCADE;
-- définition des tables
CREATE TABLE services (
  num_service serial PRIMARY KEY,
  nom_service character varying(20),
  localisation character varying(20),
  departement integer,
  date_creation date
);
CREATE TABLE services_big (
  num_service serial PRIMARY KEY,
  nom_service character varying(20),
  localisation character varying(20),
  departement integer,
  date_creation date
);
CREATE TABLE employes (
  matricule serial primary key,
  nom varchar(15) not null,
  prenom varchar(15) not null,
  fonction varchar(20) not null,
  manager integer,
  date_embauche date,
  num_service integer not null references services (num_service)
);
CREATE TABLE employes_big (
  matricule serial primary key,
  nom varchar(15) not null,
  prenom varchar(15) not null,
  fonction varchar(20) not null,
  manager integer,
  date_embauche date,
  num_service integer not null references services (num_service)
);
-- ajout des données
INSERT INTO services
VALUES
  (
    1, 'Comptabilité', 'Paris', 75, '2006-09-03'
  ),
  (
    2, 'R&D', 'Rennes', 40, '2009-08-03'
  ),
  (
    3, 'Commerciaux', 'Limoges', 52, '2006-09-03'
  ),
  (
    4, 'Consultants', 'Nantes', 44, '2009-08-03'
  );
INSERT INTO services_big (
  nom_service, localisation, departement,
  date_creation
)
VALUES
  (
    'Comptabilité', 'Paris', 75, '2006-09-03'
  ),
  ('R&D', 'Rennes', 40, '2009-08-03'),
  (
    'Commerciaux', 'Limoges', 52, '2006-09-03'
  ),
  (
    'Consultants', 'Nantes', 44, '2009-08-03'
  );
INSERT INTO services_big (
  nom_service, localisation, departement,
  date_creation
)
SELECT
  s.nom_service,
  s.localisation,
  s.departement,
  s.date_creation
FROM
  services s,
  generate_series(1, 10000);
INSERT INTO employes
VALUES
  (
    33, 'Roy', 'Arthur', 'Consultant',
    105, '2000-06-01', 4
  ),
  (
    81, 'Prunelle', 'Léon', 'Commercial',
    97, '2000-06-01', 3
  ),
  (
    97, 'Lebowski', 'Dude', 'Responsable',
    104, '2003-01-01', 3
  ),
  (
    104, 'Cruchot', 'Ludovic', 'Directeur Général',
    NULL, '2005-03-06', 3
  ),
  (
    105, 'Vacuum', 'Anne-Lise', 'Responsable',
    104, '2005-03-06', 4
  ),
  (
    119, 'Thierrie', 'Armand', 'Consultant',
    105, '2006-01-01', 4
  ),
  (
    120, 'Tricard', 'Gaston', 'Développeur',
    125, '2006-01-01', 2
  ),
  (
    125, 'Berlicot', 'Jules', 'Responsable',
    104, '2006-03-01', 2
  ),
  (
    126, 'Fougasse', 'Lucien', 'Comptable',
    128, '2006-03-01', 1
  ),
  (
    128, 'Cruchot', 'Josépha', 'Responsable',
    105, '2006-03-01', 1
  ),
  (
    131, 'Lareine-Leroy', 'Émilie', 'Développeur',
    125, '2006-06-01', 2
  ),
  (
    135, 'Brisebard', 'Sylvie', 'Commercial',
    97, '2006-09-01', 3
  ),
  (
    136, 'Barnier', 'Germaine', 'Consultant',
    105, '2006-09-01', 4
  ),
  (
    137, 'Pivert', 'Victor', 'Consultant',
    105, '2006-09-01', 4
  );
-- on copie la table employes
INSERT INTO employes_big
SELECT
  *
FROM
  employes;
-- duplication volontaire des lignes d'un des employés
INSERT INTO employes_big
SELECT
  i,
  nom,
  prenom,
  fonction,
  manager,
  date_embauche,
  num_service
FROM
  employes_big,
  LATERAL generate_series(1000, 500000) i
WHERE
  matricule = 137;
-- création des index
CREATE INDEX ON employes(date_embauche);
CREATE INDEX ON employes_big(date_embauche);
CREATE INDEX ON employes_big(num_service);
-- calcul des statistiques sur les nouvelles données
VACUUM ANALYZE;

EXPLAIN (ANALYZE,BUFFERS)
SELECT manager, fonction, num_service, COUNT(*)
FROM employes_big
GROUP BY CUBE(manager,fonction,num_service);
