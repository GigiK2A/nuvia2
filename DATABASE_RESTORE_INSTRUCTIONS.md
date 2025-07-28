# Istruzioni per ripristinare il database Nuvia

## Prerequisiti
- PostgreSQL 12 o superiore installato
- Accesso a un database PostgreSQL (locale o cloud)

## Passi per il ripristino

1. Crea un nuovo database:
   ```sql
   CREATE DATABASE nuvia_db;
   ```

2. Ripristina i dati dal backup:
   ```bash
   psql -h <host> -p <port> -U <username> -d nuvia_db < database_backup.sql
   ```

3. Aggiorna il file .env con la nuova DATABASE_URL:
   ```
   DATABASE_URL=postgresql://username:password@host:port/nuvia_db
   ```

## Note
- Il backup include schema completo e tutti i dati
- Le tabelle vengono ricreate automaticamente
- Tutti gli utenti, progetti, eventi e conversazioni sono inclusi

Data backup: 2025-07-28T17:05:29.642Z
