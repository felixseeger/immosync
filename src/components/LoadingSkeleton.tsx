export function PostCardSkeleton() {
  return (
    <article className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm">
      {/* Featured Image Skeleton */}
      <div className="relative w-full aspect-video skeleton-bg animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-6 flex flex-col gap-4">
        {/* Category Badge Skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-16 skeleton-bg rounded animate-pulse" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-7 skeleton-bg rounded animate-pulse" />
          <div className="h-7 w-3/4 skeleton-bg rounded animate-pulse" />
        </div>

        {/* Excerpt Skeleton */}
        <div className="space-y-2 grow">
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-2/3 skeleton-bg rounded animate-pulse" />
        </div>

        {/* Meta Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-24 skeleton-bg rounded animate-pulse" />
        </div>

        {/* Read More Skeleton */}
        <div className="h-5 w-24 skeleton-bg rounded animate-pulse" />
      </div>
    </article>
  );
}

export function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PostContentSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-background" suppressHydrationWarning>
      <article className="max-w-4xl mx-auto px-4 py-16">
        {/* Header Skeleton */}
        <header className="mb-8">
          {/* Category Skeleton */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 skeleton-bg rounded-full animate-pulse" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-3 mb-4">
            <div className="h-10 skeleton-bg rounded animate-pulse" />
            <div className="h-10 w-2/3 skeleton-bg rounded animate-pulse" />
          </div>

          {/* Meta Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 skeleton-bg rounded animate-pulse" />
            <div className="h-4 w-32 skeleton-bg rounded animate-pulse" />
          </div>
        </header>

        {/* Featured Image Skeleton */}
        <div className="relative w-full aspect-video mb-8 rounded-lg skeleton-bg animate-pulse" />

        {/* Content Skeleton */}
        <div className="space-y-4">
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-5/6 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-4/5 skeleton-bg rounded animate-pulse" />
          <div className="h-6 mt-8 mb-4 w-1/3 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-3/4 skeleton-bg rounded animate-pulse" />
        </div>
      </article>
    </div>
  );
}

export function CategoryHeaderSkeleton() {
  return (
    <header className="mb-16 text-center">
      <div className="h-12 w-48 mx-auto skeleton-bg rounded animate-pulse mb-4" />
      <div className="h-5 w-32 mx-auto skeleton-bg rounded animate-pulse" />
    </header>
  );
}

/** Shared page header (title + subtitle) for list pages */
export function PageHeaderSkeleton() {
  return (
    <header className="max-w-3xl mb-16">
      <div className="h-14 md:h-20 w-full max-w-2xl skeleton-bg rounded animate-pulse mb-6" />
      <div className="h-6 w-full skeleton-bg rounded animate-pulse" />
      <div className="h-6 w-4/5 mt-2 skeleton-bg rounded animate-pulse" />
    </header>
  );
}

function PortfolioCardSkeleton() {
  return (
    <article className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm flex flex-col">
      <div className="relative w-full aspect-video skeleton-bg animate-pulse" />
      <div className="p-6 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-5 w-14 skeleton-bg rounded animate-pulse" />
          <div className="h-5 w-20 skeleton-bg rounded animate-pulse" />
        </div>
        <div className="h-7 w-3/4 skeleton-bg rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-5/6 skeleton-bg rounded animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export function PortfolioGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="w-full">
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 skeleton-bg rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <PortfolioCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function ServiceCardSkeleton() {
  return (
    <article className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="w-full h-24 skeleton-bg animate-pulse" />
      <div className="p-6 flex flex-col grow">
        <div className="h-8 w-3/4 skeleton-bg rounded animate-pulse mb-3" />
        <div className="space-y-2 grow">
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 skeleton-bg rounded animate-pulse" />
          <div className="h-4 w-2/3 skeleton-bg rounded animate-pulse" />
        </div>
        <div className="h-5 w-24 mt-4 skeleton-bg rounded animate-pulse" />
      </div>
    </article>
  );
}

export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
