"use client";

import useCollectionsStore from "@/store/collectionStore";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/general";
import { CreateCollectionForm } from "@/components/Forms";

function DashboardWelcomeScreen() {
  const [open, setOpen] = useState(false);

  const { collections } = useCollectionsStore();
  return (
    <div
      className={`xl:px-0 lg:px-0 lg:pr-5 px-5 h-full select-none pr-5 ${collections.length === 0 ? " col-span-3 lg:col-span-5 xl:col-span-7" : "lg:col-span-3 xl:col-span-5"}`}
    >
      <div className="md:h-[calc(100vh-5rem)] h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] overflow-y-scroll w-full flex flex-col justify-center items-center space-y-6 p-4">
        <h1 className="text-3xl font-bold text-center dark:text-white">
          Welcome to Your Dashboard
        </h1>
        <p className="text-lg text-center max-w-xl dark:text-gray-300">
          {collections.length === 0
            ? "It looks like you haven't created any collections yet. To get started, create a new collection."
            : "It looks like you haven't selected a collection yet. To get started, create a new collection or select an existing one from the sidebar."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <ResponsiveDialog
            onOpenChange={setOpen}
            open={open}
            title="Create New Collection"
            description="Create a new collection by filling all the required fields"
            trigger={
              <div className={`bg-zinc-300 hover:bg-zinc-400 px-6 py-2 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 dark:text-zinc-200 rounded-md cursor-pointer`}>
                Create New Collection
              </div>
            }
          >
            <CreateCollectionForm afterSubmit={() => setOpen(false)} />
          </ResponsiveDialog>
        </div>
      </div>
    </div>
  );
}

export default DashboardWelcomeScreen;
