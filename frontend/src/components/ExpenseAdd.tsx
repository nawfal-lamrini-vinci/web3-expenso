import type { Expense } from "../types/Expense";

interface ExpenseAddProps {
  addExpense: (expense: Expense) => void;
}

export default function ExpenseAdd({ addExpense }: ExpenseAddProps) {

  const handleAddClick = () => {
    const id = Date.now().toString();
    const payer = Math.random() < 0.5 ? "Alice" : "Bob";
    // entre 0 et 100, arrondi à 2 décimales (les centimes)
    const amount = Math.round(Math.random() * 100 * 100) / 100;

    const newExpense: Expense = {
      id,
      date: new Date().toISOString(),
      description: `New expense ${id}`,
      payer,
      amount,
    };

    addExpense(newExpense);
  };

  return <button onClick={handleAddClick}>Add</button>;
}
