export type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; category: string; description: string; date: string };
export type Budget = { id: string; initial: number };
export type Totals = { initial: number; income: number; expenses: number; total: number; remaining: number };
export type Result = { error?: string };
