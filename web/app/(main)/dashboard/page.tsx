"use client";

import { Collections, Links } from "@/components/dashboard";
function DashboardPage() {
  return (
    <>
      <div
        className={`grid xl:grid-cols-7 lg:grid-cols-5 grid-cols-3 gap-4 dark:bg-zinc-900 dark:text-zinc-100`}
      >
        <Collections />
        <Links />
      </div>
    </>
  );
}

export default DashboardPage;
