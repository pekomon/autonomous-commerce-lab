interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <div aria-hidden="true" className="product-grid product-grid-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <article className="product-card product-card-skeleton" key={index}>
          <div className="skeleton-block skeleton-image" />
          <div className="product-card-content">
            <div className="skeleton-block skeleton-line skeleton-line-title" />
            <div className="skeleton-block skeleton-line skeleton-line-price" />
            <div className="badge-row">
              <div className="skeleton-block skeleton-pill" />
              <div className="skeleton-block skeleton-pill" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
