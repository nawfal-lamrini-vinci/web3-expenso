import { useState } from "react";
import ExpenseAdd from "../components/ExpenseAdd";
import ExpenseItem from "../components/ExpenseItem";
import useExpenses from "../hooks/useExpenses";

export default function Home() {
  const { expenses, loading, error, addExpense, resetExpenses } = useExpenses();
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    const ok = await resetExpenses();
    if (ok) {
      setMessage("Données réinitialisées !");
      setTimeout(() => setMessage(null), 1000);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      {error && <p style={{ color: "red" }}>Erreur : {error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}

      <ExpenseAdd addExpense={addExpense} />
      <button onClick={handleReset}>Reset Data</button>
    </div>
  );
}
