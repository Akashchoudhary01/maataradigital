export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    red: 'bg-danger-50 text-danger-600',
    yellow: 'bg-warning-50 text-warning-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
