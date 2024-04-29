# Comment Start le Projet Back

- docker run --name mariadb_container_initdb -v init.sql:/docker-entrypoint-initdb.d/init.sql -e MARIADB_ROOT_PASSWORD=3a8dec982ed29bfc33ded35aaeec0728b50f6f906fd9a7d02b26df45f32e0e81 -d mariadb
