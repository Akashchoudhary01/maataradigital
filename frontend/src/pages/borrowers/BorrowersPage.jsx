import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Users } from 'lucide-react';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export default function BorrowersPage() {
  const navigate = useNavigate();
  const [borrowers, setBorrowers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBorrowers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/borrowers?${params}`);
      setBorrowers(data.data);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => {
    const delay = setTimeout(fetchBorrowers, 300);
    return () => clearTimeout(delay);
  }, [fetchBorrowers]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/borrowers/${deleteTarget._id}`);
      toast.success('Borrower deleted successfully');
      setDeleteTarget(null);
      fetchBorrowers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete borrower');
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Borrowers</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all borrower accounts</p>
        </div>
        <button onClick={() => navigate('/borrowers/new')} className="btn-primary">
          <Plus size={16} /> Add Borrower
        </button>
      </div>

      <div className="card !p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={handleSearchChange} placeholder="Search by name, mobile, Aadhaar..." className="input pl-9" />
        </div>
      </div>

      <div className="table-container bg-white rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : borrowers.length === 0 ? (
          <EmptyState icon={Users} title="No borrowers found"
            description={search ? 'Try a different search term' : 'Add your first borrower to get started'}
            action={!search && <button onClick={() => navigate('/borrowers/new')} className="btn-primary"><Plus size={16} /> Add Borrower</button>} />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Borrower</th>
                  <th className="th">Mobile</th>
                  <th className="th hidden md:table-cell">Aadhaar</th>
                  <th className="th hidden lg:table-cell">City</th>
                  <th className="th hidden lg:table-cell">Income/Month</th>
                  <th className="th hidden sm:table-cell">Joined</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {borrowers.map((b) => (
                  <tr key={b._id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        {b.photo ? (
                          <img src={b.photo} alt={b.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {b.fullName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{b.fullName}</p>
                          {b.fatherName && <p className="text-xs text-gray-400">S/o {b.fatherName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="td">{b.mobileNumber}</td>
                    <td className="td hidden md:table-cell">{b.aadhaarNumber ? `XXXX-XXXX-${b.aadhaarNumber.slice(-4)}` : '-'}</td>
                    <td className="td hidden lg:table-cell">{b.address?.city || '-'}</td>
                    <td className="td hidden lg:table-cell">
                      {b.monthlyIncome ? `₹${Number(b.monthlyIncome).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="td hidden sm:table-cell text-gray-400 text-xs">
                      {new Date(b.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/borrowers/${b._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="View"><Eye size={15} /></button>
                        <button onClick={() => navigate(`/borrowers/${b._id}/edit`)} className="p-1.5 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg" title="Edit"><Edit size={15} /></button>
                        <button onClick={() => setDeleteTarget(b)} className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Borrower"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
        confirmLabel="Delete" danger />
    </div>
  );
}
