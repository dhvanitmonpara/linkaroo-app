"use client";

import { Button } from "@/components/ui/button";

function AddCollaboratorForm({
  getSharableLink,
}: {
  getSharableLink: () => void;
}) {
  return (
    <>
      <div className="grid w-full grid-cols-12 justify-center items-center dark:text-zinc-600 text-zinc-300">
        <span className="col-span-5">
          <hr className="dark:border-zinc-600 border-zinc-300" />
        </span>
        <span className="col-span-2 flex justify-center items-center text-xs">
          OR
        </span>
        <span className="col-span-5">
          <hr className="dark:border-zinc-600 border-zinc-300" />
        </span>
      </div>
      <div className="w-full h-full space-y-2">
        <Button
          onClick={getSharableLink}
          className="w-full flex justify-center p-0 items-center dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
        >
          Get a sharable link
        </Button>
      </div>
    </>
  );
}

export default AddCollaboratorForm;
