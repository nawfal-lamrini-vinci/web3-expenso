import type { Expense } from "../types/Expense";

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <div>
      <span>{expense.date}</span> — <span>{expense.description}</span> —{" "}
      <span>{expense.payer}</span> — <span>${expense.amount.toFixed(2)}</span>
    </div>
  );
}