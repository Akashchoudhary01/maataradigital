import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CreditCard, Calendar, Phone, Mail, MapPin, Briefcase, FileText, Plus } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers';
import toast from 'react-hot-toast';

function DocImage({ src, label }) {
  if (!src) return <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-200">{label}<br/>Not uploaded</div>;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img src={src} alt={label} className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer" />
      <p className="text-xs text-gray-500 text-center mt-1">{label}</p>
    </a>
  );
}

export default function BorrowerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [borrower, setBorrower] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/borrowers/${id}`);
      setBorrower(data.data);
      setLoans(data.data.loans || []);
    } catch { toast.error('Failed to load borrower'); navigate('/borrowers'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!borrower) return null;

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const completedLoans = loans.filter(l => l.status === 'COMPLETED');
  const totalBorrowed = loans.reduce((s, l) => s + l.principalAmount, 0);
  const totalRemaining = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + l.remainingAmount, 0);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'loans', label: `Loans (${loans.length})` },
    { key: 'documents', label: 'Documents' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/borrowers')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
          <h1 className="page-title">Borrower Profile</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/loans/new?borrowerId=${id}`)} className="btn-primary"><Plus size={16} /> New Loan</button>
          <button onClick={() => navigate(`/borrowers/${id}/edit`)} className="btn-outline"><Edit size={16} /> Edit</button>
        </div>
      </div>

      {/* Hero card */}
      <div className="card">
        <div className="flex items-start gap-5 flex-wrap">
          {borrower.photo ? (
            <img src={borrower.photo} alt={borrower.fullName} className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200 shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shrink-0">
              {borrower.fullName?.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{borrower.fullName}</h2>
            {borrower.fatherName && <p className="text-gray-500 text-sm">S/o {borrower.fatherName}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {borrower.mobileNumber && <span className="flex items-center gap-1"><Phone size={13} />{borrower.mobileNumber}</span>}
              {borrower.email && <span className="flex items-center gap-1"><Mail size={13} />{borrower.email}</span>}
              {borrower.address?.city && <span className="flex items-center gap-1"><MapPin size={13} />{borrower.address.city}, {borrower.address.state}</span>}
              {borrower.occupation && <span className="flex items-center gap-1"><Briefcase size={13} />{borrower.occupation}</span>}
            </div>
          </div>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Loans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{activeLoans.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBorrowed)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Borrowed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-danger-600">{formatCurrency(totalRemaining)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h3 className="section-title">Personal Details</h3>
            {[
              ['Gender', borrower.gender],
              ['Date of Birth', borrower.dateOfBirth ? formatDate(borrower.dateOfBirth) : null],
              ['Monthly Income', borrower.monthlyIncome ? formatCurrency(borrower.monthlyIncome) : null],
              ['Aadhaar', borrower.aadhaarNumber ? `XXXX-XXXX-${borrower.aadhaarNumber.slice(-4)}` : null],
              ['PAN', borrower.panNumber],
              ['Alternate Mobile', borrower.alternateNumber],
            ].map(([label, val]) => val ? (
              <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{val}</span>
              </div>
            ) : null)}
          </div>
          <div className="card space-y-3">
            <h3 className="section-title">Address</h3>
            {borrower.address ? (
              <div className="space-y-1.5 text-sm">
                {borrower.address.village && <p className="text-gray-700">{borrower.address.village},</p>}
                {borrower.address.city && <p className="text-gray-700">{borrower.address.city} - {borrower.address.pincode}</p>}
                {borrower.address.district && <p className="text-gray-700">{borrower.address.district}</p>}
                {borrower.address.state && <p className="font-medium text-gray-800">{borrower.address.state}</p>}
              </div>
            ) : <p className="text-gray-400 text-sm">No address on record</p>}
          </div>
        </div>
      )}

      {/* Loans tab */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="card text-center py-12">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No loans yet</p>
              <button onClick={() => navigate(`/loans/new?borrowerId=${id}`)} className="btn-primary mt-4"><Plus size={16} /> Create Loan</button>
            </div>
          ) : loans.map((loan) => (
            <div key={loan._id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/loans/${loan._id}`)}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${getStatusBadge(loan.status)}`}>{loan.status}</span>
                    <span className="text-xs text-gray-400">{formatDate(loan.createdAt)}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.principalAmount)}</p>
                  <p className="text-sm text-gray-500 mt-1">{loan.monthlyInterestRate}% monthly × {loan.loanDurationMonths} months</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-lg font-semibold text-danger-600">{formatCurrency(loan.remainingAmount)}</p>
                  <p className="text-xs text-gray-400 mt-1">EMI: {formatCurrency(loan.emiAmount)}/month</p>
                </div>
              </div>
              {loan.status === 'ACTIVE' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Paid: {formatCurrency(loan.paidAmount || 0)}</span>
                    <span>Total: {formatCurrency(loan.totalPayableAmount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, ((loan.paidAmount || 0) / loan.totalPayableAmount) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="card">
          <h3 className="section-title mb-4">Uploaded Documents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DocImage src={borrower.photo} label="Photo" />
            <DocImage src={borrower.aadhaarFrontImage} label="Aadhaar Front" />
            <DocImage src={borrower.aadhaarBackImage} label="Aadhaar Back" />
            <DocImage src={borrower.panCardImage} label="PAN Card" />
          </div>
        </div>
      )}
    </div>
  );
}
