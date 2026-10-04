import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';

import './db.ts'; // opens the database and creates its tables

const app = express();
app.use(cors()); // lets the web version of the app call this server
app.use(express.json()); // puts JSON request bodies in req.body

// Quick check that the server is up: open http://localhost:4000/health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register routes here, e.g. app.use('/places', placesRouter);

// Unknown URLs and errors answer with JSON too, so the app can show the message.
// Error details are also printed in this terminal.
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});
const handleErrors: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
};
app.use(handleErrors);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
