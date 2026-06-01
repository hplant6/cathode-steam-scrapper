import 'dotenv/config';
import app from './api/index.js';

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  if (!process.env.STEAMGRIDDB_API_KEY) {
    console.warn('[server] STEAMGRIDDB_API_KEY is not set — copy .env.example to .env and add your key');
  }
});
