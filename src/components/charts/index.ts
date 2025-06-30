/**
 * Centralized chart components export to avoid circular dependency issues
 * This file properly imports and re-exports recharts components to prevent
 * the "Cannot access 'P' before initialization" error
 */

// Core recharts components
export {
  ResponsiveContainer,
  Legend,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

// Bar chart components
export {
  BarChart,
  Bar
} from 'recharts';

// Line chart components
export {
  LineChart,
  Line
} from 'recharts';

// Pie chart components
export {
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Area chart components
export {
  AreaChart,
  Area
} from 'recharts';
