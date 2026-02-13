type MainAreaProps = {
  children: React.ReactNode;
};

const MainArea = ({ children }: MainAreaProps) => {
  return <main className="space-y-6">{children}</main>;
};

export default MainArea;
