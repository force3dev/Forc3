interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "We hit an unexpected error. Try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="font-bold text-lg text-neutral-200">{title}</h3>
      <p className="text-sm text-neutral-500 mt-2 max-w-xs">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-6 py-2.5 bg-[#1a1a1a] border border-[#262626] text-neutral-200 font-semibold rounded-xl hover:border-[#0066FF] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
