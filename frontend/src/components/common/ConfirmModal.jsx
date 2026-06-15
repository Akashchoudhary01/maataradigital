import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-danger-50' : 'bg-warning-50'}`}>
          <AlertTriangle size={24} className={danger ? 'text-danger-600' : 'text-warning-600'} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center">{title}</h3>
        <p className="text-gray-500 text-sm text-center mt-2">{message}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="btn-outline flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
