import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      arr.push(i);
    }
    if (page - delta > 2) arr.unshift('...');
    if (page + delta < pages - 1) arr.push('...');
    arr.unshift(1);
    if (pages > 1) arr.push(pages);
    return arr;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-xl">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{from}</span> to{' '}
        <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
