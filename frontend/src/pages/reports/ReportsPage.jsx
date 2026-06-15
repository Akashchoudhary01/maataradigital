import { useState } from 'react';
import { BarChart3, Download, Filter, FileText, TrendingUp, Users, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { key: 'collection', label: 'Collection Report', icon: TrendingUp, color: 'text-success-600' },
  { key: 'loans', label: 'Loan Report', icon: FileText, color: 'text-primary-600' },
  { key: 'penalties', label: 'Penalty Report', icon: AlertCircle, color: 'text-danger-600' },
  { key: 'borrowers', label: 'Borrower Report', icon: Users, color: 'text-purple-600' },
];

function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) { toast.error('No data to export'); return; }
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => {
    const val = c.accessor(row);
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : (val ?? '');
  }).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success('Report exported!');
}

export default function ReportsPage() {
  const [activeType, setActiveType] = useState('collection');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeType });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const { data: res } = await api.get(`/dashboard/reports?${params}`);
      setData(res.data);
      setGenerated(true);
      toast.success(`${res.data.length} records found`);
    } catch (e) {
      toast.error('Failed to generate report');
    } finally { setLoading(false); }
  };

  const getColumns = () => {
    switch (activeType) {
      case 'collection':
        return [
          { label: 'Borrower', accessor: r => r.borrowerId?.fullName },
          { label: 'Mobile', accessor: r => r.borrowerId?.mobileNumber },
          { label: 'Installment #', accessor: r => r.installmentNumber },
          { label: 'EMI Amount', accessor: r => r.emiAmount },
          { label: 'Penalty', accessor: r => r.penaltyAmount || 0 },
          { label: 'Total Paid', accessor: r => r.paidAmount },
          { label: 'Paid Date', accessor: r => formatDate(r.paidDate) },
        ];
      case 'loans':
        return [
          { label: 'Borrower', accessor: r => r.borrowerId?.fullName },
          { label: 'Mobile', accessor: r => r.borrowerId?.mobileNumber },
          { label: 'Principal', accessor: r => r.principalAmount },
          { label: 'Interest Rate', accessor: r => `${r.monthlyInterestRate}%` },
          { label: 'Duration', accessor: r => `${r.loanDurationMonths} months` },
          { label: 'Total Payable', accessor: r => r.totalPayableAmount },
          { label: 'Remaining', accessor: r => r.remainingAmount },
          { label: 'Status', accessor: r => r.status },
          { label: 'Start Date', accessor: r => formatDate(r.startDate) },
        ];
      case 'penalties':
        return [
          { label: 'Borrower', accessor: r => r.borrowerId?.fullName },
          { label: 'Mobile', accessor: r => r.borrowerId?.mobileNumber },
          { label: 'Amount', accessor: r => r.amount },
          { label: 'Reason', accessor: r => r.reason },
          { label: 'Added By', accessor: r => r.addedBy?.name },
          { label: 'Date', accessor: r => formatDate(r.createdAt) },
        ];
      case 'borrowers':
        return [
          { label: 'Full Name', accessor: r => r.fullName },
          { label: 'Father Name', accessor: r => r.fatherName },
          { label: 'Mobile', accessor: r => r.mobileNumber },
          { label: 'Gender', accessor: r => r.gender },
          { label: 'City', accessor: r => r.address?.city },
          { label: 'State', accessor: r => r.address?.state },
          { label: 'Occupation', accessor: r => r.occupation },
          { label: 'Monthly Income', accessor: r => r.monthlyIncome },
          { label: 'Joined', accessor: r => formatDate(r.createdAt) },
        ];
      default: return [];
    }
  };

  const columns = getColumns();

  const renderTable = () => {
    if (!generated) return (
      <div className="text-center py-16 text-gray-400">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-50" />
        <p>Select filters and click "Generate Report"</p>
      </div>
    );
    if (data.length === 0) return (
      <div className="text-center py-16 text-gray-400">
        <p>No data found for selected filters</p>
      </div>
    );

    // Summary for collection
    let summary = null;
    if (activeType === 'collection') {
      const total = data.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const penalty = data.reduce((s, r) => s + (r.penaltyAmount || 0), 0);
      summary = (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-success-50 rounded-xl p-3 text-center">
            <p className="text-xs text-success-700">Total Collected</p>
            <p className="font-bold text-success-800 text-lg">{formatCurrency(total)}</p>
          </div>
          <div className="bg-danger-50 rounded-xl p-3 text-center">
            <p className="text-xs text-danger-700">Total Penalty</p>
            <p className="font-bold text-danger-800 text-lg">{formatCurrency(penalty)}</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <p className="text-xs text-primary-700">Records</p>
            <p className="font-bold text-primary-800 text-lg">{data.length}</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {summary}
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>{columns.map(c => <th key={c.label} className="th">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="tr">
                  {columns.map(c => (
                    <td key={c.label} className="td">
                      {c.label === 'Status' ? (
                        <span className={`badge ${getStatusBadge(c.accessor(row))}`}>{c.accessor(row)}</span>
                      ) : (c.accessor(row) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Generate and export financial reports</p>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => { setActiveType(key); setGenerated(false); setData([]); }}
            className={`card !p-4 text-left transition-all hover:shadow-md ${activeType === key ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}>
            <Icon size={20} className={`${color} mb-2`} />
            <p className="text-sm font-medium text-gray-800">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input !py-1.5 text-sm w-36" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input !py-1.5 text-sm w-36" />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <BarChart3 size={15} />}
            Generate Report
          </button>
          {generated && data.length > 0 && (
            <button onClick={() => exportToCSV(data, activeType, columns)} className="btn-outline">
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title capitalize">{activeType.replace('_', ' ')} Report</h3>
          {generated && <span className="text-sm text-gray-400">{data.length} records</span>}
        </div>
        <div className="p-6">{renderTable()}</div>
      </div>
    </div>
  );
}
