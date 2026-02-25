interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export default function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg text-neutral-200">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mt-2 max-w-xs">{description}</p>
      )}
      {action && (action.href ? (
        <a
          href={action.href}
          className="mt-5 px-6 py-2.5 bg-[#0066FF] text-white font-semibold rounded-xl hover:bg-[#0052CC] transition-colors inline-block"
        >
          {action.label}
        </a>
      ) : (
        <button
          onClick={action.onClick}
          className="mt-5 px-6 py-2.5 bg-[#0066FF] text-white font-semibold rounded-xl hover:bg-[#0052CC] transition-colors"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
