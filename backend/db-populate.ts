import fs from 'node:fs';
import path from 'node:path';
import { db } from './src/prisma/db.ts';

// Les mêmes données que le JSON de la semaine 1
const INIT_FILE = path.join(import.meta.dirname, 'data/expenses.init.json');

type JsonExpense = {
  id: string;
  date: string;
  description: string;
  payer: string;
  amount: number;
};

async function main() {
  const jsonExpenses: JsonExpense[] = JSON.parse(fs.readFileSync(INIT_FILE, 'utf-8'));

  // On ne reprend pas l'id du JSON : la DB le génère (autoincrement)
  const expenses = jsonExpenses.map(({ date, description, payer, amount }) => ({
    date,
    description,
    payer,
    amount,
  }));

  const created = await db.orm.public.Expense.createAll(expenses);
  console.log(`${created.length} dépenses insérées :`);
  console.log(created);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
