import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Receipt, CheckCircle, Filter, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate, getStatusBadge, daysOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

function PenaltyModal({ repayment, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(`/repayments/${repayment._id}/penalty`, { amount: Number(data.amount), reason: data.reason });
      toast.success('Penalty added successfully');
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add penalty');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Add Penalty</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Installment #{repayment.installmentNumber} for{' '}
          <strong>{repayment.borrowerId?.fullName}</strong>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Penalty Amount (₹) *</label>
            <input {...register('amount', { required: 'Amount required', min: { value: 1, message: 'Minimum ₹1' }, valueAsNumber: true })}
              type="number" className={`input ${errors.amount ? 'input-error' : ''}`} placeholder="e.g. 500" />
            {errors.amount && <p className="text-danger-600 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="label">Reason *</label>
            <textarea {...register('reason', { required: 'Reason required' })} rows={2}
              className={`input resize-none ${errors.reason ? 'input-error' : ''}`} placeholder="e.g. Late payment penalty" />
            {errors.reason && <p className="text-danger-600 text-xs mt-1">{errors.reason.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-danger flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Penalty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RepaymentsPage() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const [repayments, setRepayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(urlParams.get('status') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState(null);
  const [penaltyTarget, setPenaltyTarget] = useState(null);

  const fetchRepayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const { data } = await api.get(`/repayments?${params}`);
      setRepayments(data.data);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, status, startDate, endDate]);

  useEffect(() => { fetchRepayments(); }, [fetchRepayments]);

  const handleMarkPaid = async (repayment) => {
    setPayingId(repayment._id);
    try {
      await api.put(`/repayments/${repayment._id}/pay`, { paidDate: new Date() });
      toast.success('Payment collected!');
      fetchRepayments();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setPayingId(null); }
  };

  const handleUndoPay = async (repaymentId) => {
    try {
      await api.put(`/repayments/${repaymentId}/undo-pay`);
      toast.success('Payment reversed');
      fetchRepayments();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const statusTabs = ['', 'PENDING', 'PAID', 'OVERDUE'];
  const statusLabels = { '': 'All', PENDING: 'Pending', PAID: 'Paid', OVERDUE: 'Overdue' };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Repayments</h1>
        <p className="text-gray-500 text-sm mt-0.5">View and manage all EMI payments</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {statusTabs.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="card !p-3 flex items-center gap-3 flex-wrap">
        <Filter size={15} className="text-gray-400" />
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From:</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="input !py-1.5 text-sm w-36" />
          <label className="text-gray-500">To:</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="input !py-1.5 text-sm w-36" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          )}
        </div>
      </div>

      <div className="table-container bg-white rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : repayments.length === 0 ? (
          <EmptyState icon={Receipt} title="No repayments found" description="Try different filters" />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Borrower</th>
                  <th className="th">EMI #</th>
                  <th className="th">Due Date</th>
                  <th className="th">EMI Amount</th>
                  <th className="th hidden sm:table-cell">Penalty</th>
                  <th className="th">Total Due</th>
                  <th className="th">Status</th>
                  <th className="th hidden md:table-cell">Paid Date</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {repayments.map((r) => {
                  const overdueDays = r.status === 'OVERDUE' ? daysOverdue(r.dueDate) : 0;
                  return (
                    <tr key={r._id} className={`tr ${r.status === 'OVERDUE' ? 'bg-danger-50/20' : ''}`}>
                      <td className="td">
                        <div>
                          <button onClick={() => navigate(`/borrowers/${r.borrowerId?._id}`)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            {r.borrowerId?.fullName}
                          </button>
                          <p className="text-xs text-gray-400">{r.borrowerId?.mobileNumber}</p>
                        </div>
                      </td>
                      <td className="td font-medium">#{r.installmentNumber}</td>
                      <td className="td">
                        <div>
                          <p className={r.status === 'OVERDUE' ? 'text-danger-600 font-medium' : ''}>{formatDate(r.dueDate)}</p>
                          {overdueDays > 0 && <p className="text-xs text-danger-500">{overdueDays} days overdue</p>}
                        </div>
                      </td>
                      <td className="td">{formatCurrency(r.emiAmount)}</td>
                      <td className="td hidden sm:table-cell">
                        {r.penaltyAmount > 0 ? <span className="text-danger-600 text-xs font-medium">+{formatCurrency(r.penaltyAmount)}</span> : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="td font-semibold">{formatCurrency(r.totalDue)}</td>
                      <td className="td"><span className={`badge ${getStatusBadge(r.status)}`}>{r.status}</span></td>
                      <td className="td hidden md:table-cell text-xs text-gray-400">{r.paidDate ? formatDate(r.paidDate) : '—'}</td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          {r.status !== 'PAID' && (
                            <>
                              <button onClick={() => handleMarkPaid(r)} disabled={payingId === r._id}
                                className="btn-success text-xs !py-1 !px-2.5">
                                {payingId === r._id ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✓ Collect'}
                              </button>
                              <button onClick={() => setPenaltyTarget(r)} className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg" title="Add Penalty">
                                <AlertTriangle size={14} />
                              </button>
                            </>
                          )}
                          {r.status === 'PAID' && (
                            <button onClick={() => handleUndoPay(r._id)} className="text-xs text-gray-400 hover:text-danger-600 hover:underline px-2">Undo</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {penaltyTarget && (
        <PenaltyModal repayment={penaltyTarget} onClose={() => setPenaltyTarget(null)} onSuccess={fetchRepayments} />
      )}
    </div>
  );
}
