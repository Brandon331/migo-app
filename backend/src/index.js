import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth.routes.js';
import { goalsRouter } from './routes/goals.routes.js';
import { milestonesRouter } from './routes/milestones.routes.js';
import { syncRouter } from './routes/sync.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);

app.use('/goals', requireAuth, goalsRouter);
app.use('/milestones', requireAuth, milestonesRouter);
app.use('/sync', requireAuth, syncRouter);
app.use('/chat', requireAuth, chatRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
