export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-gray-700 font-semibold text-base">{title}</h3>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
