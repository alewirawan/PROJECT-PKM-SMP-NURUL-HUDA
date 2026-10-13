export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-symbol ${className}`.trim()} aria-hidden="true">
      <span>N</span>
      <i />
    </span>
  );
}
