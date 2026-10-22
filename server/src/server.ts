import express from 'express';
import cors from 'cors';
import { tideEngine } from './services/tidecloakService';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/state', async (_req, res) => {
  const state = await tideEngine.getFullState();
  res.json(state);
});

app.post('/api/ingest', async (req, res) => {
  try {
    const { operator, clientCipherHex } = req.body;
    if (operator !== 'dod' && operator !== 'starlink') {
      return res.status(400).json({ error: 'Invalid operator.' });
    }
    const record = tideEngine.ingestEncryptedEphemeris(operator, clientCipherHex);
    const state = await tideEngine.getFullState();
    res.json({ success: true, record, state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sign', async (req, res) => {
  try {
    const { party, clientSignatureHex, actorName } = req.body;
    const authHeader = req.headers.authorization;
    const jwtToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    await tideEngine.signQuorumCondition(party, { jwtToken, clientSignatureHex, actorName });
    const state = await tideEngine.getFullState();
    res.json({ success: true, state });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/resolve', async (req, res) => {
  try {
    const { tokenSecret } = req.body;
    const recommendation = tideEngine.executeBlindConjunctionResolution(tokenSecret);
    const state = await tideEngine.getFullState();
    res.json({ success: true, recommendation, state });
  } catch (err: any) {
    const state = await tideEngine.getFullState();
    res.status(403).json({ error: err.message, state });
  }
});

app.post('/api/admin-breach-test', async (req, res) => {
  const { adminActor } = req.body || {};
  const result = tideEngine.simulateRogueAdminBreachAttempt(adminActor);
  const state = await tideEngine.getFullState();
  res.status(401).json({ ...result, state });
});

app.post('/api/reset', async (_req, res) => {
  tideEngine.resetWorkflow();
  const state = await tideEngine.getFullState();
  res.json({ success: true, state });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[BlindOrbit Backend] Listening on http://localhost:${PORT}`);
});
