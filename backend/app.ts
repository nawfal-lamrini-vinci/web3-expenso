import express from 'express';
import logger from 'morgan';
import expenseRouter from "./routes/expenses.ts";
import cors from "cors";

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', /\.onrender\.com$/] }));
app.use("/api/expenses", expenseRouter)

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});

export default app;
