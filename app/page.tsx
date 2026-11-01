import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";
import type { Tx } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const now = new Date();
  let year = now.getFullYear(), month = now.getMonth() + 1;
  const match = m?.match(/^(\d{4})-(\d{2})$/);
  if (match && +match[2] >= 1 && +match[2] <= 12) { year = +match[1]; month = +match[2]; }

  const [settings, budget] = await Promise.all([
    prisma.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.monthlyBudget.findUnique({
      where: { year_month: { year, month } },
      include: { transactions: { orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }] } },
    }),
  ]);

  const transactions: Tx[] = (budget?.transactions ?? []).map((t) => ({
    id: t.id, type: t.type, amount: t.amount.toNumber(), category: t.category,
    description: t.description, date: t.transactionDate.toISOString().slice(0, 10),
  }));
  const initial = budget?.initialAmount.toNumber() ?? 0;
  const income = transactions.filter((t) => t.type === "INCOME").reduce((a, t) => a + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "EXPENSE").reduce((a, t) => a + t.amount, 0);
  const total = initial + income;

  return (
    <Dashboard
      year={year} month={month} currency={settings.currency} theme={settings.theme as "light" | "dark"}
      budget={budget ? { id: budget.id, initial } : null}
      totals={{ initial, income, expenses, total, remaining: total - expenses }}
      transactions={transactions}
    />
  );
}
