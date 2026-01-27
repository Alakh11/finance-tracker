import { 
  createRouter, 
  createRoute, 
  createRootRouteWithContext, 
  Outlet, 
  redirect,
  NotFoundRoute, 
} from '@tanstack/react-router';
import axios from 'axios';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import Recurring from './components/Recurring/Recurring';
import BudgetPlanner from './components/Budget/BudgetPlanner';
import Goals from './components/Goals/Goals';
import Analytics from './components/Analytics/Analytics';
import CategoryManager from './components/CategoryManager/CategoryManager';
import type { User } from './types';
import NotFound from './components/Error/NotFound';
import ErrorPage from './components/Error/ErrorPage';

// Context for the router (User is required)
interface RouterContext {
  user: User;
  handleLogout: () => void;
}

const API_URL = "https://finance-tracker-q60v.onrender.com";

// --- 1. Root Route (Layout) ---
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  errorComponent: ({ error }) => {
    return <ErrorPage code={500} customMessage={error.message} />;
  },
  notFoundComponent: NotFound,
});

// --- 2. Dashboard Route ---
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dashboard',
  loader: async ({ context }) => {
    const [dashboard, categories] = await Promise.all([
        axios.get(`${API_URL}/dashboard/${context.user.email}`),
        axios.get(`${API_URL}/categories/${context.user.email}`)
    ]);
    return { ...dashboard.data, categories: categories.data };
  },
  component: Dashboard,
});

// --- 3. Transactions Route ---
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'transactions',
  loader: async ({ context }) => {
    const [transactions, categories] = await Promise.all([
        axios.get(`${API_URL}/transactions/all/${context.user.email}`),
        axios.get(`${API_URL}/categories/${context.user.email}`)
    ]);
    return { 
        initialTransactions: transactions.data, 
        categories: categories.data 
    };
  },
  component: Transactions,
});

// --- 4. Budget Route ---
const budgetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'budget',
  loader: async ({ context }) => {
    const [status, categories, history] = await Promise.all([
        axios.get(`${API_URL}/budgets/${context.user.email}`),
        axios.get(`${API_URL}/categories/${context.user.email}`),
        axios.get(`${API_URL}/budgets/history/${context.user.email}`)
    ]);
    return { 
        budgets: status.data, 
        categories: categories.data,
        history: history.data 
    };
  },
  component: BudgetPlanner,
});

// --- 5. Goals Route ---
const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'goals',
  loader: async ({ context }) => {
    const res = await axios.get(`${API_URL}/goals/${context.user.email}`);
    return { goals: res.data };
  },
  component: Goals,
});

// --- 5. Recurring Route ---
const recurringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'recurring',
  loader: async ({ context }) => {
    const res = await axios.get(`${API_URL}/recurring/${context.user.email}`);
    return res.data;
  },
  component: Recurring,
});

// --- 6. Analytics Route ---
const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'analytics',
  loader: async ({ context }) => {
    const [analytics, dailyIncome, monthlyIncome, categoryMonthly, goals] = await Promise.all([
        axios.get(`${API_URL}/analytics/${context.user.email}`),
        axios.get(`${API_URL}/income/daily/${context.user.email}`),
        axios.get(`${API_URL}/income/monthly/${context.user.email}`),
        axios.get(`${API_URL}/analytics/category-monthly/${context.user.email}`),
        axios.get(`${API_URL}/goals/${context.user.email}`)
    ]);
    return { 
        ...analytics.data, 
        dailyIncome: dailyIncome.data, 
        monthlyIncome: monthlyIncome.data,
        categoryMonthly: categoryMonthly.data,
        goals: goals.data 
    };
  },
  component: Analytics,
});

// --- 7. Categories Route ---
const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'categories',
  loader: async ({ context }) => {
    const res = await axios.get(`${API_URL}/categories/${context.user.email}`);
    return res.data;
  },
  component: CategoryManager,
});

// --- 8. Index Redirect ---
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFound,
});

// --- Assemble Route Tree ---
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  transactionsRoute,
  budgetRoute,
  goalsRoute,
  recurringRoute,
  analyticsRoute,
  categoriesRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: '/finance-tracker', 
  context: { 
    user: undefined!, 
    handleLogout: undefined!
  },
  notFoundRoute,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
export default router;