import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CreditCard, CheckCircle, AlertTriangle,
  TrendingUp, IndianRupee, Clock, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatMonthYear } from '../../utils/helpers';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await api.get('/dashboard');
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary = {}, alerts = {}, charts = {}, recentPayments = [] } = data || {};

  const monthlyData = (charts.monthlyCollection || []).map((d) => ({
    name: formatMonthYear(d._id.year, d._id.month),
    collected: d.collected,
  }));

  const pieData = (charts.loanDistribution || []).filter(d => d.count > 0).map((d) => ({
    name: d.status, value: d.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's your overview.</p>
        </div>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {(alerts.dueToday > 0 || alerts.overdue > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alerts.dueToday > 0 && (
            <div onClick={() => navigate('/repayments?status=PENDING')}
              className="flex items-center gap-3 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-warning-100 transition-colors">
              <Clock size={18} className="text-warning-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning-800">{alerts.dueToday} installment{alerts.dueToday > 1 ? 's' : ''} due today</p>
                <p className="text-xs text-warning-600">Click to collect</p>
              </div>
            </div>
          )}
          {alerts.overdue > 0 && (
            <div onClick={() => navigate('/repayments?status=OVERDUE')}
              className="flex items-center gap-3 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-danger-100 transition-colors">
              <AlertTriangle size={18} className="text-danger-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-danger-800">{alerts.overdue} overdue installment{alerts.overdue > 1 ? 's' : ''}</p>
                <p className="text-xs text-danger-600">Immediate attention needed</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Borrowers" value={summary.totalBorrowers || 0} icon={Users} color="blue" />
        <StatCard title="Active Loans" value={summary.totalActiveLoans || 0} icon={CreditCard} color="indigo" />
        <StatCard title="Completed Loans" value={summary.totalCompletedLoans || 0} icon={CheckCircle} color="green" />
        <StatCard title="Defaulted Loans" value={summary.totalDefaultedLoans || 0} icon={XCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Disbursed" value={formatCurrency(summary.totalLoanAmount)} icon={IndianRupee} color="purple" subtitle="Principal amount" />
        <StatCard title="Total Collected" value={formatCurrency(summary.totalCollected)} icon={TrendingUp} color="green" subtitle="Payments received" />
        <StatCard title="Pending Amount" value={formatCurrency(summary.totalRemaining)} icon={Clock} color="yellow" subtitle="Outstanding balance" />
        <StatCard title="Penalty Collected" value={formatCurrency(summary.totalPenaltyCollected)} icon={AlertTriangle} color="red" subtitle="Total penalties" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="section-title mb-4">Monthly Collection (Last 6 Months)</h3>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No collection data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Collected']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Loan Status</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No loan data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Payments</h3>
          <button onClick={() => navigate('/repayments')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</button>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No payments recorded yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentPayments.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success-50 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.borrowerId?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">EMI #{r.installmentNumber} • {r.paidDate ? new Date(r.paidDate).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-success-700">{formatCurrency(r.paidAmount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
