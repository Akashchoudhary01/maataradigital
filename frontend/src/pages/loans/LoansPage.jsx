import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, CreditCard, Filter } from 'lucide-react';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers';

const STATUS_OPTIONS = ['', 'ACTIVE', 'COMPLETED', 'DEFAULTED'];

export default function LoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const { data } = await api.get(`/loans?${params}`);
      setLoans(data.data);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    const delay = setTimeout(fetchLoans, 300);
    return () => clearTimeout(delay);
  }, [fetchLoans]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleStatus = (e) => { setStatus(e.target.value); setPage(1); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all loan accounts</p>
        </div>
        <button onClick={() => navigate('/loans/new')} className="btn-primary"><Plus size={16} /> Create Loan</button>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={handleSearch} placeholder="Search by borrower name or mobile..." className="input pl-9 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={status} onChange={handleStatus} className="input w-40">
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container bg-white rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <EmptyState icon={CreditCard} title="No loans found"
            description={search || status ? 'Try different filters' : 'Create your first loan to get started'}
            action={!search && !status && <button onClick={() => navigate('/loans/new')} className="btn-primary"><Plus size={16} /> Create Loan</button>} />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Borrower</th>
                  <th className="th">Principal</th>
                  <th className="th hidden sm:table-cell">Rate / Duration</th>
                  <th className="th hidden md:table-cell">EMI</th>
                  <th className="th hidden lg:table-cell">Remaining</th>
                  <th className="th">Status</th>
                  <th className="th hidden sm:table-cell">Created</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loans.map((loan) => (
                  <tr key={loan._id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {loan.borrowerId?.photo ? (
                          <img src={loan.borrowerId.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                            {loan.borrowerId?.fullName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-gray-900">{loan.borrowerId?.fullName}</p>
                          <p className="text-xs text-gray-400">{loan.borrowerId?.mobileNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td font-semibold text-gray-900">{formatCurrency(loan.principalAmount)}</td>
                    <td className="td hidden sm:table-cell text-gray-500 text-xs">
                      {loan.monthlyInterestRate}% / {loan.loanDurationMonths} mo
                    </td>
                    <td className="td hidden md:table-cell">{formatCurrency(loan.emiAmount)}</td>
                    <td className="td hidden lg:table-cell">
                      <span className={loan.remainingAmount > 0 ? 'text-danger-600 font-medium' : 'text-success-600 font-medium'}>
                        {formatCurrency(loan.remainingAmount)}
                      </span>
                    </td>
                    <td className="td">
                      <span className={`badge ${getStatusBadge(loan.status)}`}>{loan.status}</span>
                    </td>
                    <td className="td hidden sm:table-cell text-gray-400 text-xs">{formatDate(loan.createdAt)}</td>
                    <td className="td text-right">
                      <button onClick={() => navigate(`/loans/${loan._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="View Details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
