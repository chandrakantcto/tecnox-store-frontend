export function AuthValidationAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[2px] border border-red-600/35 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-800 border-l-4 border-l-red-600"
    >
      {children}
    </div>
  );
}
