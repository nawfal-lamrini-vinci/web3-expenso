import { useEffect, useState } from "react";
import type { Expense } from "../types/Expense";

const host = import.meta.env.VITE_API_URL || "http://unknown-api-url.com";
const API_URL = `${host}/api/expenses`;

export default function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Va chercher la liste sur le backend
  const fetchExpenses = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data: Expense[] = await response.json();
      setExpenses(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Appelé UNE fois, quand le composant apparaît à l'écran
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Envoie une nouvelle dépense puis recharge la liste
  const addExpense = async (expense: Expense) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      await fetchExpenses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

  // Réinitialise les données puis recharge la liste.
  // Renvoie true/false pour que Home sache s'il doit afficher un message.
  const resetExpenses = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/reset`, { method: "POST" });
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data: Expense[] = await response.json();
      setExpenses(data)
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      return false;
    }
  };

  return { expenses, loading, error, addExpense, resetExpenses };
}
