"use client";

import { Collections, Links } from "@/components/dashboard";
function CollectionDashboardPage() {
  return (
    <>
      <div
        className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 dark:bg-zinc-900 dark:text-zinc-100 w-full max-w-full overflow-x-hidden`}
      >
        <Collections />
        <Links />
      </div>
    </>
  );
}

export default CollectionDashboardPage;
