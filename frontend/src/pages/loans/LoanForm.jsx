import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calculator, Search } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

function calcLoan(principal, rate, months) {
  if (!principal || !rate || !months) return null;
  const totalInterest = principal * (rate / 100) * months;
  const totalPayable = principal + totalInterest;
  const emi = Math.ceil(totalPayable / months);
  return { totalInterest, totalPayable, emi };
}

export default function LoanForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillBorrowerId = searchParams.get('borrowerId');

  const [loading, setLoading] = useState(false);
  const [calc, setCalc] = useState(null);
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [borrowers, setBorrowers] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      monthlyInterestRate: 2,
    }
  });

  const principal = watch('principalAmount');
  const rate = watch('monthlyInterestRate');
  const months = watch('loanDurationMonths');

  useEffect(() => {
    setCalc(calcLoan(Number(principal), Number(rate), Number(months)));
  }, [principal, rate, months]);

  useEffect(() => {
    if (prefillBorrowerId) fetchBorrowerById(prefillBorrowerId);
  }, [prefillBorrowerId]);

  const fetchBorrowerById = async (bid) => {
    try {
      const { data } = await api.get(`/borrowers/${bid}`);
      setSelectedBorrower(data.data);
      setValue('borrowerId', bid);
    } catch {}
  };

  useEffect(() => {
    if (!borrowerSearch.trim()) { setBorrowers([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/borrowers?search=${borrowerSearch}&limit=5`);
        setBorrowers(data.data);
        setShowDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [borrowerSearch]);

  const selectBorrower = (b) => {
    setSelectedBorrower(b);
    setValue('borrowerId', b._id);
    setBorrowerSearch('');
    setBorrowers([]);
    setShowDropdown(false);
  };

  const onSubmit = async (data) => {
    if (!data.borrowerId) { toast.error('Please select a borrower'); return; }
    setLoading(true);
    try {
      await api.post('/loans', {
        ...data,
        principalAmount: Number(data.principalAmount),
        monthlyInterestRate: Number(data.monthlyInterestRate),
        loanDurationMonths: Number(data.loanDurationMonths),
      });
      toast.success('Loan created with repayment schedule!');
      navigate('/loans');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create loan');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/loans')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="page-title">Create New Loan</h1>
          <p className="text-gray-500 text-sm">Fill in loan details. EMI will be calculated automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Borrower Selection */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Select Borrower</h3>
          {selectedBorrower ? (
            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                {selectedBorrower.photo ? (
                  <img src={selectedBorrower.photo} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">{selectedBorrower.fullName?.charAt(0)}</div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{selectedBorrower.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedBorrower.mobileNumber}</p>
                </div>
              </div>
              {!prefillBorrowerId && (
                <button type="button" onClick={() => { setSelectedBorrower(null); setValue('borrowerId', ''); }} className="text-sm text-danger-600 hover:text-danger-700">Change</button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={borrowerSearch}
                onChange={(e) => setBorrowerSearch(e.target.value)}
                onFocus={() => borrowers.length && setShowDropdown(true)}
                placeholder="Search borrower by name or mobile..."
                className="input pl-9"
              />
              {showDropdown && borrowers.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {borrowers.map(b => (
                    <div key={b._id} onClick={() => selectBorrower(b)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">{b.fullName?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{b.fullName}</p>
                        <p className="text-xs text-gray-400">{b.mobileNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {borrowerSearch && borrowers.length === 0 && (
                <p className="mt-2 text-sm text-gray-400">No borrowers found. <span className="text-primary-600 cursor-pointer" onClick={() => navigate('/borrowers/new')}>Create new borrower →</span></p>
              )}
            </div>
          )}
          <input type="hidden" {...register('borrowerId')} />
        </div>

        {/* Loan Details */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Loan Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Loan Amount (₹) *</label>
              <input {...register('principalAmount', { required: 'Amount required', min: { value: 1000, message: 'Minimum ₹1,000' }, valueAsNumber: true })}
                type="number" className={`input ${errors.principalAmount ? 'input-error' : ''}`} placeholder="e.g. 100000" />
              {errors.principalAmount && <p className="text-danger-600 text-xs mt-1">{errors.principalAmount.message}</p>}
            </div>
            <div>
              <label className="label">Monthly Interest Rate (%) *</label>
              <input {...register('monthlyInterestRate', { required: 'Rate required', min: { value: 0.1, message: 'Min 0.1%' }, max: { value: 30, message: 'Max 30%' }, valueAsNumber: true })}
                type="number" step="0.1" className={`input ${errors.monthlyInterestRate ? 'input-error' : ''}`} placeholder="e.g. 2" />
              {errors.monthlyInterestRate && <p className="text-danger-600 text-xs mt-1">{errors.monthlyInterestRate.message}</p>}
            </div>
            <div>
              <label className="label">Duration (Months) *</label>
              <input {...register('loanDurationMonths', { required: 'Duration required', min: { value: 1, message: 'Minimum 1 month' }, max: { value: 120, message: 'Max 120 months' }, valueAsNumber: true })}
                type="number" className={`input ${errors.loanDurationMonths ? 'input-error' : ''}`} placeholder="e.g. 12" />
              {errors.loanDurationMonths && <p className="text-danger-600 text-xs mt-1">{errors.loanDurationMonths.message}</p>}
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input {...register('startDate', { required: 'Start date required' })} type="date" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Any notes about this loan..." />
          </div>
        </div>

        {/* Calculator preview */}
        {calc && (
          <div className="card bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-primary-600" />
              <h3 className="font-semibold text-primary-800">Loan Summary (Auto-Calculated)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Interest', value: formatCurrency(calc.totalInterest), color: 'text-warning-700' },
                { label: 'Total Payable', value: formatCurrency(calc.totalPayable), color: 'text-gray-900' },
                { label: 'Monthly EMI', value: formatCurrency(calc.emi), color: 'text-primary-700' },
                { label: 'Duration', value: `${months} Months`, color: 'text-gray-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`font-bold text-base ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">* Using flat interest rate. Total Interest = Principal × Rate × Months</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/loans')} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading || !calc} className="btn-primary px-6">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Create Loan
          </button>
        </div>
      </form>
    </div>
  );
}
