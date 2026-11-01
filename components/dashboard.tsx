"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Moon, Pencil, Plus, Sun, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { createBudget, deleteBudget, deleteTransaction, saveTransaction, updateBudget, updateSettings } from "@/app/actions";
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, cn, formatMoney, monthKey, monthLabel } from "@/lib/utils";
import type { Budget, Result, Totals, Tx } from "@/lib/types";

type Props = { year: number; month: number; currency: string; theme: "light" | "dark"; budget: Budget | null; totals: Totals; transactions: Tx[] };
type Dlg = null | { kind: "tx"; type: Tx["type"]; tx?: Tx } | { kind: "budget" };

const COLORS = ["#2a9d8f", "#e76f51", "#e9c46a", "#457b9d", "#8d6bb8", "#6a994e", "#d6638a", "#f4a261", "#8a8f98"];
const parseAmount = (s: string) => Number(s.replace(/[\s,]/g, ""));

export function Dashboard({ year, month, currency, theme, budget, totals, transactions }: Props) {
  const router = useRouter();
  const [dlg, setDlg] = useState<Dlg>(null);
  const [filter, setFilter] = useState<"ALL" | Tx["type"]>("ALL");
  const [pending, start] = useTransition();
  const money = (n: number) => formatMoney(n, currency);

  const go = (y: number, m: number) => router.push(`/?m=${monthKey(y, m)}`);
  const shift = (d: number) => { const dt = new Date(Date.UTC(year, month - 1 + d, 1)); go(dt.getUTCFullYear(), dt.getUTCMonth() + 1); };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    start(async () => { await updateSettings({ theme: next }); });
  };

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === "EXPENSE").forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const visible = transactions.filter((t) => filter === "ALL" || t.type === filter);
  const spentPct = totals.total > 0 ? Math.min(100, (totals.expenses / totals.total) * 100) : totals.expenses > 0 ? 100 : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 grid grid-cols-[1fr_auto] items-center gap-3 sm:mb-8 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Wallet className="size-5" /></div>
          <h1 className="text-xl font-semibold tracking-tight">Budget</h1>
        </div>
        <div className="order-last col-span-2 flex items-center gap-1.5 sm:order-none sm:col-span-1 sm:gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></Button>
          <Input
            type="month" aria-label="Choose month" value={monthKey(year, month)} className="h-9 min-w-0 flex-1 font-medium sm:w-[9.5rem] sm:flex-none"
            onChange={(e) => { const m = e.target.value.match(/^(\d{4})-(\d{2})$/); if (m) go(+m[1], +m[2]); }}
          />
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Currency" className="h-9 w-[5.5rem]" value={currency}
            onChange={(e) => start(async () => { await updateSettings({ currency: e.target.value }); })}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      {!budget ? (
        <NewBudget year={year} month={month} />
      ) : (
        <div className={cn("space-y-6", pending && "opacity-80")}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{monthLabel(year, month)}</h2>
              <p className="text-sm text-muted-foreground">Total budget {money(totals.total)}</p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Button variant="income" onClick={() => setDlg({ kind: "tx", type: "INCOME" })}><Plus />Add income</Button>
              <Button variant="expense" onClick={() => setDlg({ kind: "tx", type: "EXPENSE" })}><Plus />Add expense</Button>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary bg-primary text-primary-foreground sm:col-span-2 lg:col-span-1">
              <CardHeader><CardTitle className="text-primary-foreground/80">Remaining balance</CardTitle></CardHeader>
              <CardContent>
                <p className={cn("text-xl font-semibold sm:text-2xl", totals.remaining < 0 && "underline decoration-wavy")}>{money(totals.remaining)}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/25">
                  <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${spentPct}%` }} />
                </div>
                <p className="mt-2 text-xs text-primary-foreground/80">{spentPct.toFixed(0)}% of budget spent</p>
              </CardContent>
            </Card>
            <Stat title="Initial budget" value={money(totals.initial)} action={<Button variant="ghost" size="icon" className="size-7" onClick={() => setDlg({ kind: "budget" })} aria-label="Edit initial budget"><Pencil /></Button>} />
            <Stat title="Additional income" value={money(totals.income)} tone="income" icon={<ArrowUpRight className="size-4 text-income" />} />
            <Stat title="Total expenses" value={money(totals.expenses)} tone="expense" icon={<ArrowDownRight className="size-4 text-expense" />} />
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Expenses by category</CardTitle></CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">Add an expense to see where your money goes.</p>
                ) : (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                            {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {byCategory.map((c, i) => (
                        <li key={c.name} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>
                          <span className="text-muted-foreground">{money(c.value)} · {((c.value / totals.expenses) * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <div className="flex rounded-md border p-0.5 text-xs">
                  {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={cn("rounded-sm px-2.5 py-1 font-medium", filter === f ? "bg-secondary" : "text-muted-foreground hover:text-foreground")}>
                      {f === "ALL" ? "All" : f === "INCOME" ? "Income" : "Expenses"}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {visible.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">No transactions yet. Use Add income or Add expense above.</p>
                ) : (
                  <ul className="divide-y">
                    {visible.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 py-3">
                        <div className={cn("grid size-9 shrink-0 place-items-center rounded-full", t.type === "INCOME" ? "bg-income/15 text-income" : "bg-expense/15 text-expense")}>
                          {t.type === "INCOME" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium">{t.category}{t.description && <span className="font-normal text-muted-foreground"> — {t.description}</span>}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.date + "T00:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center sm:gap-3">
                        <p className={cn("whitespace-nowrap text-sm font-semibold", t.type === "INCOME" ? "text-income" : "text-expense")}>{t.type === "INCOME" ? "+" : "−"}{money(t.amount)}</p>
                        <div className="flex">
                          <Button variant="ghost" size="icon" className="size-8" aria-label="Edit transaction" onClick={() => setDlg({ kind: "tx", type: t.type, tx: t })}><Pencil /></Button>
                          <Button variant="ghost" size="icon" className="size-8" aria-label="Delete transaction"
                            onClick={() => confirm("Delete this transaction?") && start(async () => { await deleteTransaction(t.id); })}><Trash2 /></Button>
                        </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"
              onClick={() => confirm(`Delete the ${monthLabel(year, month)} budget and all its transactions? This cannot be undone.`) && start(async () => { await deleteBudget(budget.id); })}>
              <Trash2 />Delete this month's budget
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dlg !== null} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          {dlg?.kind === "tx" && budget && <TxForm budget={budget} year={year} month={month} type={dlg.type} tx={dlg.tx} onDone={() => setDlg(null)} />}
          {dlg?.kind === "budget" && budget && <BudgetForm budget={budget} onDone={() => setDlg(null)} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Stat({ title, value, icon, action, tone }: { title: string; value: string; icon?: React.ReactNode; action?: React.ReactNode; tone?: "income" | "expense" }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>{icon}{action}</CardHeader>
      <CardContent><p className={cn("text-xl font-semibold sm:text-2xl", tone === "income" && "text-income", tone === "expense" && "text-expense")}>{value}</p></CardContent>
    </Card>
  );
}

function useSubmit(onDone: () => void) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const submit = (fn: () => Promise<Result>) => start(async () => {
    const r = await fn();
    if (r.error) setError(r.error); else onDone();
  });
  return { error, setError, pending, submit };
}

function NewBudget({ year, month }: { year: number; month: number }) {
  const [amount, setAmount] = useState("");
  const { error, setError, pending, submit } = useSubmit(() => {});
  return (
    <Card className="mx-auto mt-10 max-w-md">
      <CardContent className="space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold">No budget for {monthLabel(year, month)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set the amount you start this month with. You can add income any time.</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const n = parseAmount(amount);
          if (!Number.isFinite(n) || n < 0 || amount.trim() === "") return setError("Enter a valid initial amount.");
          submit(() => createBudget(year, month, n));
        }}>
          <div className="space-y-2"><Label htmlFor="init">Initial amount</Label>
            <Input id="init" inputMode="decimal" placeholder="3 000 000" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={pending}>Create budget</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BudgetForm({ budget, onDone }: { budget: Budget; onDone: () => void }) {
  const [amount, setAmount] = useState(String(budget.initial));
  const { error, setError, pending, submit } = useSubmit(onDone);
  return (
    <form className="grid gap-4" onSubmit={(e) => {
      e.preventDefault();
      const n = parseAmount(amount);
      if (!Number.isFinite(n) || n < 0 || amount.trim() === "") return setError("Enter a valid initial amount.");
      submit(() => updateBudget(budget.id, n));
    }}>
      <div><DialogTitle className="text-lg font-semibold">Edit initial budget</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Additional income is kept separately.</DialogDescription></div>
      <div className="space-y-2"><Label htmlFor="ib">Initial amount</Label><Input id="ib" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button disabled={pending}>Save changes</Button>
    </form>
  );
}

function TxForm({ budget, year, month, type, tx, onDone }: { budget: Budget; year: number; month: number; type: Tx["type"]; tx?: Tx; onDone: () => void }) {
  const first = `${monthKey(year, month)}-01`;
  const last = `${monthKey(year, month)}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const today = new Date(); const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const cats = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [category, setCategory] = useState(tx?.category ?? cats[0]);
  const [date, setDate] = useState(tx?.date ?? (t >= first && t <= last ? t : first));
  const [description, setDescription] = useState(tx?.description ?? "");
  const { error, setError, pending, submit } = useSubmit(onDone);
  const options = cats.includes(category) ? cats : [category, ...cats];

  return (
    <form className="grid gap-4" onSubmit={(e) => {
      e.preventDefault();
      const n = parseAmount(amount);
      if (!Number.isFinite(n) || n <= 0) return setError("Amount must be greater than zero.");
      submit(() => saveTransaction({ id: tx?.id, budgetId: budget.id, type, amount: n, category, description, date }));
    }}>
      <div><DialogTitle className="text-lg font-semibold">{tx ? "Edit" : "Add"} {type === "INCOME" ? "income" : "expense"}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">{type === "INCOME" ? "Adds to this month's total budget." : "Subtracts from your remaining balance."}</DialogDescription></div>
      <div className="space-y-2"><Label htmlFor="amt">Amount</Label><Input id="amt" inputMode="decimal" placeholder="50 000" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="cat">Category</Label>
          <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>{options.map((c) => <option key={c}>{c}</option>)}</Select></div>
        <div className="space-y-2"><Label htmlFor="dt">Date</Label>
          <Input id="dt" type="date" min={first} max={last} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="desc">Description</Label><Input id="desc" maxLength={200} placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant={type === "INCOME" ? "income" : "expense"} disabled={pending}>{tx ? "Save changes" : type === "INCOME" ? "Add income" : "Add expense"}</Button>
    </form>
  );
}
