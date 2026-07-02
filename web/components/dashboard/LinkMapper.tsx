"use client";

import useLinkStore from "@/store/linkStore";
import useMethodStore from "@/store/MethodStore";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/general";
import useProfileStore from "@/store/profileStore";
import { CreateLinkBar, CreateLinkForm } from "../Forms";
import { Button } from "../ui/button";
import LinkCard from "./LinkCard";

function LinkMapper() {

  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);

  const { currentCollectionItem, links } = useLinkStore()
  const { currentCardColor } = useMethodStore()
  const { profile } = useProfileStore()

  const getItemType = (type: string, currentCollectionItem?: { type?: string }) =>
    ["movies", "books", "tv-shows", "banners"].includes(currentCollectionItem?.type || type)
      ? "banners"
      : ["music", "playlists", "video-games", "food", "sports", "bookmarks", "cards"].includes(type)
        ? "cards"
        : "todos";

  const itemType = currentCollectionItem ? getItemType(currentCollectionItem?.type) : "todos";


  return (
    <>
      {links.length > 0 ? (
        <>
          <div
            className={`grid ${itemType === "todos" && "grid-cols-1 lg:grid-cols-2"} ${(itemType === "banners" || itemType === "cards") && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"} gap-2`}
          >
            <ResponsiveDialog
              open={isLinkFormOpen}
              onOpenChange={setIsLinkFormOpen}
              prebuildForm={!profile.useFullTypeFormAdder}
              className={`${profile.useFullTypeFormAdder ?  "md:p-0 bg-transparent border-none md:max-w-2xl" : "sm:max-w-2xl"}`}
              title="Add New Link"
              trigger={
                <div className={cn(
                  `flex justify-start items-center text-zinc-300 text-start`,
                  itemType === "todos" && `${links.length % 2 === 0 ? "lg:col-span-2" : "lg:col-span-1"}`,
                  (itemType === "banners" || itemType === "cards") && `bg-zinc-900 hover:bg-zinc-800/80 flex justify-center items-center flex-col space-y-4 cursor-pointer rounded-md w-full`,
                )}>
                  {itemType === "todos" ? <p className="py-3 px-6 flex justify-normal items-center space-x-2 border-1 border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 cursor-pointer rounded-md w-full">
                    <span>
                      <FaPlus />
                    </span>
                    <span className="pt-1">Add a new link...</span>
                  </p> :
                    <>
                      <span>
                        <FaPlus />
                      </span>
                      <span className="pt-1">Add a new link...</span>
                    </>
                  }
                </div>
              }
              showCloseButton={false}
              description="Add a new link to your collection"
            >
              {profile.useFullTypeFormAdder
                ? <div className="w-full flex-1 overflow-auto py-4">
                  <CreateLinkBar
                    afterSubmit={() => setIsLinkFormOpen(false)}
                    collectionTitle={currentCollectionItem?.title}
                  />
                </div>
                : <CreateLinkForm
                  afterSubmit={() => setIsLinkFormOpen(false)}
                  collectionTitle={currentCollectionItem?.title}
                />

              }
            </ResponsiveDialog>
            {links
              ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((link) => (
                <LinkCard
                  key={link._id}
                  id={link._id}
                  title={link.title}
                  description={link.description}
                  createdAt={link.createdAt}
                  color={currentCardColor}
                  image={link.image}
                  type={itemType}
                  link={link.link}
                  isChecked={link.isChecked}
                  contentType={link.contentType}
                />
              ))}
          </div>
          <div className="lg:h-2 h-16"></div>
        </>
      ) : (
        <div className="flex justify-center flex-col gap-4 items-center w-full h-48 lg:h-96">
          <span
            className={`dark:text-zinc-200 text-zinc-800`}
          >
            You don't have any links on this collection.
          </span>
          <ResponsiveDialog
            open={isLinkFormOpen}
            onOpenChange={setIsLinkFormOpen}
            title="Add New Link" description="Add a new link to your collection" trigger={
              <Button
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80">
                Add a Link
              </Button>
            }>
            <CreateLinkForm
              collectionTitle={currentCollectionItem?.title}
            />
          </ResponsiveDialog>
        </div>
      )}
    </>
  )
}

export default LinkMapper