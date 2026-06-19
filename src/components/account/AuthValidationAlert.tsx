export function AuthValidationAlert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="text-[13px] font-semibold text-red-600 whitespace-pre-line"
    >
      {children}
    </p>
  );
}
