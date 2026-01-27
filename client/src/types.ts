import type { ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  picture: string;
}

export interface Transaction {
  category_name: string;
  description: ReactNode;
  tags: any;
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note: string;
  payment_mode: string;
}

export interface BudgetCategory {
  name: string;
  budget_limit: number;
  spent: number;
  color: string;
}

export interface DashboardStats {
  income: number;
  expense: number;
  balance: number;
}