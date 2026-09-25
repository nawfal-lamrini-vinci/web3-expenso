import {Router} from "express";
import type {Request, Response} from "express";
import {addExpense, getAllExpenses, resetExpenses} from "../services/expenses.ts";
import type {Expense} from "../types/Expense.ts";

const router = Router();

router.get("/", (_req : Request, res : Response) => {
  try {
    res.status(200).json(getAllExpenses())
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to read expenses" });
  }
})

router.post("/", (req : Request, res : Response) => {
  try {
    const newExpense : Expense = addExpense(req.body);
    res.status(201).json(newExpense);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to create expenses" })
  }
})

router.post("/reset", (_req : Request, res : Response) => {
  try {
    const reseted : Expense[] = resetExpenses();
    res.status(200).json(reseted);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to reset expenses" })
  }
})

export default router;