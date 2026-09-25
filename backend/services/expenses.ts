import fs from "node:fs";
import path from "node:path";
import type { Expense } from "../types/Expense.ts";


const EXPENSES_FILE = path.join(import.meta.dirname, "../data/expenses.json");
const EXPENSES_INIT_FILE = path.join(import.meta.dirname, "../data/expenses.init.json");

export const getAllExpenses = () : Expense[] => {
  const data = fs.readFileSync(EXPENSES_FILE, "utf-8")
  return JSON.parse(data);
}

export const addExpense= (expense: Expense) : Expense => {
  const expenses = getAllExpenses();
  expenses.push(expense);
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
  return expense;
}

export const resetExpenses = (): Expense[] => {
  const initData = fs.readFileSync(EXPENSES_INIT_FILE, "utf-8");
  fs.writeFileSync(EXPENSES_FILE, initData);
  return JSON.parse(initData);
}