type SectionTitleProps = {
  children: React.ReactNode;
};

const SectionTitle = ({ children }: SectionTitleProps) => {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-black">
      {children}
    </h2>
  );
};

export default SectionTitle;
