import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// The whole database is the file backend/app.db. Delete it to start over with empty tables.
export const db = new DatabaseSync(join(import.meta.dirname, '..', 'app.db'));

// Creates any tables from schema.sql that don't exist yet
db.exec(readFileSync(join(import.meta.dirname, 'schema.sql'), 'utf8'));
