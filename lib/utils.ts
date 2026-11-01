import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const CURRENCIES = ["UZS", "USD", "EUR", "RUB"] as const;
export const EXPENSE_CATEGORIES = ["Food", "Transport", "Housing", "Utilities", "Health", "Shopping", "Entertainment", "Education", "Other"];
export const INCOME_CATEGORIES = ["Salary", "Bonus", "Gift", "Refund", "Other"];

export function formatMoney(n: number, currency: string) {
  const digits = currency === "UZS" ? 0 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n).replace(/\u00a0/g, " ");
}

export const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
export const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
