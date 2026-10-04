import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import { db } from '../db.ts';

// Template for new routes. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. places.ts
// 2. Rename templateRouter and template_items, e.g. placesRouter and places
// 3. Register it in src/index.ts: app.use('/places', placesRouter);
// In a query, each ? is filled in by the values passed to .get(), .all(), or .run().
// Always pass values that way, never with ${} inside the SQL (that allows SQL injection).

export const templateRouter = Router();

// Every row, e.g. GET /places
templateRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM template_items').all();
  res.json(rows);
});

// One row, e.g. GET /places/123
templateRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM template_items WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(row);
});

// Add a row, e.g. POST /places with a JSON body like { "name": "Boston" }
templateRouter.post('/', (req, res) => {
  const id = randomUUID();
  db.prepare('INSERT INTO template_items (id, name) VALUES (?, ?)').run(id, req.body.name);
  res.status(201).json({ id });
});
