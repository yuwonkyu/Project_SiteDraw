type BreadcrumbProps = {
  items: string[];
};

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-black">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-center gap-2">
            <span className="font-semibold text-black">{item}</span>
            {index < items.length - 1 && (
              <span className="text-gray-500">&gt;</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
