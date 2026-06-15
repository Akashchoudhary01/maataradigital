import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, TrendingDown, User } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { fetchLoan(); }, [id]);

  const fetchLoan = async () => {
    try {
      const { data } = await api.get(`/loans/${id}`);
      setLoan(data.data);
      setRepayments(data.data.repayments || []);
    } catch { toast.error('Failed to load loan'); navigate('/loans'); }
    finally { setLoading(false); }
  };

  const handleMarkPaid = async (repaymentId) => {
    setPayingId(repaymentId);
    try {
      await api.put(`/repayments/${repaymentId}/pay`, { paidDate: new Date() });
      toast.success('Installment marked as paid!');
      fetchLoan();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark as paid');
    } finally { setPayingId(null); }
  };

  const handleUndoPay = async (repaymentId) => {
    try {
      await api.put(`/repayments/${repaymentId}/undo-pay`);
      toast.success('Payment reversed');
      fetchLoan();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to undo payment'); }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/loans/${id}/status`, { status: statusModal });
      toast.success(`Loan marked as ${statusModal}`);
      setStatusModal(null);
      fetchLoan();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update status'); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!loan) return null;

  const paid = repayments.filter(r => r.status === 'PAID').length;
  const progress = repayments.length ? (paid / repayments.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/loans')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="page-title">Loan Details</h1>
            <p className="text-gray-500 text-sm">View repayment schedule and manage payments</p>
          </div>
        </div>
        {loan.status === 'ACTIVE' && (
          <div className="flex gap-2">
            <button onClick={() => setStatusModal('COMPLETED')} className="btn-success text-sm">Mark Completed</button>
            <button onClick={() => setStatusModal('DEFAULTED')} className="btn-danger text-sm">Mark Defaulted</button>
          </div>
        )}
      </div>

      {/* Loan summary card */}
      <div className="card">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${getStatusBadge(loan.status)}`}>{loan.status}</span>
              <span className="text-xs text-gray-400">Created {formatDate(loan.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(`/borrowers/${loan.borrowerId?._id}`)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                {loan.borrowerId?.photo ? <img src={loan.borrowerId.photo} className="w-9 h-9 rounded-full object-cover" alt="" /> : <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">{loan.borrowerId?.fullName?.charAt(0)}</div>}
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{loan.borrowerId?.fullName}</p>
                  <p className="text-xs text-gray-400">{loan.borrowerId?.mobileNumber}</p>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                ['Principal', formatCurrency(loan.principalAmount)],
                ['Interest Rate', `${loan.monthlyInterestRate}%/mo`],
                ['Duration', `${loan.loanDurationMonths} months`],
                ['Start Date', formatDate(loan.startDate)],
                ['Total Interest', formatCurrency(loan.totalInterest)],
                ['Total Payable', formatCurrency(loan.totalPayableAmount)],
                ['Monthly EMI', formatCurrency(loan.emiAmount)],
                ['Remaining', formatCurrency(loan.remainingAmount)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{paid} of {repayments.length} installments paid</span>
            <span>{progress.toFixed(0)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Paid: {formatCurrency(loan.paidAmount || 0)}</span>
            <span>•</span>
            <span className="text-danger-600 font-medium">Remaining: {formatCurrency(loan.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Repayment schedule */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title">Repayment Schedule</h3>
          <div className="flex gap-2 text-xs">
            <span className="badge badge-green">Paid: {paid}</span>
            <span className="badge badge-yellow">Pending: {repayments.filter(r => r.status === 'PENDING').length}</span>
            <span className="badge badge-red">Overdue: {repayments.filter(r => r.status === 'OVERDUE').length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">#</th>
                <th className="th">Due Date</th>
                <th className="th">EMI</th>
                <th className="th">Penalty</th>
                <th className="th">Total Due</th>
                <th className="th">Status</th>
                <th className="th hidden sm:table-cell">Paid Date</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {repayments.map((r) => (
                <tr key={r._id} className={`tr ${r.status === 'OVERDUE' ? 'bg-danger-50/30' : ''}`}>
                  <td className="td font-medium">{r.installmentNumber}</td>
                  <td className="td">
                    <span className={r.status === 'OVERDUE' ? 'text-danger-600 font-medium' : ''}>
                      {formatDate(r.dueDate)}
                    </span>
                  </td>
                  <td className="td">{formatCurrency(r.emiAmount)}</td>
                  <td className="td">
                    {r.penaltyAmount > 0 ? <span className="text-danger-600 font-medium">{formatCurrency(r.penaltyAmount)}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="td font-semibold">{formatCurrency(r.totalDue)}</td>
                  <td className="td"><span className={`badge ${getStatusBadge(r.status)}`}>{r.status}</span></td>
                  <td className="td hidden sm:table-cell text-gray-400 text-xs">{r.paidDate ? formatDate(r.paidDate) : '—'}</td>
                  <td className="td text-right">
                    {r.status === 'PAID' ? (
                      <button onClick={() => handleUndoPay(r._id)} className="text-xs text-gray-400 hover:text-danger-600 hover:underline">Undo</button>
                    ) : (
                      <button onClick={() => handleMarkPaid(r._id)} disabled={payingId === r._id}
                        className="btn-success text-xs !py-1 !px-3">
                        {payingId === r._id ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✓ Collect'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        onConfirm={handleStatusUpdate}
        loading={updatingStatus}
        title={`Mark Loan as ${statusModal}`}
        message={`Are you sure you want to mark this loan as ${statusModal}? This will update the loan status.`}
        confirmLabel="Confirm"
        danger={statusModal === 'DEFAULTED'}
      />
    </div>
  );
}
