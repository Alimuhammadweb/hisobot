"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Result } from "@/lib/types";

const done = (): Result => { revalidatePath("/"); return {}; };
const fail = (error: string): Result => ({ error });
const validAmount = (n: number, allowZero = false) => Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) && n < 1e13;

export async function createBudget(year: number, month: number, initial: number): Promise<Result> {
  if (!validAmount(initial, true)) return fail("Enter a valid initial amount.");
  if (month < 1 || month > 12) return fail("Invalid month.");
  const exists = await prisma.monthlyBudget.findUnique({ where: { year_month: { year, month } } });
  if (exists) return fail("A budget for this month already exists.");
  await prisma.monthlyBudget.create({ data: { year, month, initialAmount: initial } });
  return done();
}

export async function updateBudget(id: string, initial: number): Promise<Result> {
  if (!validAmount(initial, true)) return fail("Enter a valid initial amount.");
  await prisma.monthlyBudget.update({ where: { id }, data: { initialAmount: initial } });
  return done();
}

export async function deleteBudget(id: string): Promise<Result> {
  await prisma.monthlyBudget.delete({ where: { id } });
  return done();
}

export async function saveTransaction(input: {
  id?: string; budgetId: string; type: "INCOME" | "EXPENSE"; amount: number; category: string; description: string; date: string;
}): Promise<Result> {
  if (!validAmount(input.amount)) return fail("Amount must be greater than zero.");
  if (!input.category) return fail("Choose a category.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return fail("Choose a date.");
  const budget = await prisma.monthlyBudget.findUnique({ where: { id: input.budgetId } });
  if (!budget) return fail("Budget not found.");
  const [y, m] = input.date.split("-").map(Number);
  if (y !== budget.year || m !== budget.month) return fail("Date must be inside the budget's month.");
  const data = {
    type: input.type, amount: input.amount, category: input.category,
    description: input.description.trim().slice(0, 200), transactionDate: new Date(`${input.date}T00:00:00.000Z`),
  };
  if (input.id) await prisma.transaction.update({ where: { id: input.id }, data });
  else await prisma.transaction.create({ data: { ...data, budgetId: input.budgetId } });
  return done();
}

export async function deleteTransaction(id: string): Promise<Result> {
  await prisma.transaction.delete({ where: { id } });
  return done();
}

export async function updateSettings(s: { theme?: "light" | "dark"; currency?: string }): Promise<Result> {
  await prisma.appSettings.upsert({ where: { id: 1 }, update: s, create: { id: 1, ...s } });
  return done();
}
