type SectionTitleProps = {
  children: React.ReactNode;
};

const SectionTitle = ({ children }: SectionTitleProps) => {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
      {children}
    </h2>
  );
};

export default SectionTitle;
