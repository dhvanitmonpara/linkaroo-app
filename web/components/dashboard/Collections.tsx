"use client";

import { fetchedCollectionType } from "@/lib/types";
import useProfileStore from "@/store/profileStore";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton"
import useCollectionsStore from "@/store/collectionStore";
import { IoMdAdd } from "react-icons/io";
import CollectionGridCard from "./CollectionGridCard";
import CollectionListCard from "../general/CollectionListCard";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { IoGrid } from "react-icons/io5";
import { FaThList } from "react-icons/fa";
import ResponsiveDialog from "../general/ResponsiveDialog";
import { CreateCollectionForm } from "../Forms";

type CollectionsProps = {
  className?: string;
  defaultView?: CollectionView
  extraElementClassNames?: string
}
type CollectionView = "list" | "grid";
const tabTriggerClass =
  "bg-zinc-900 text-zinc-300 !h-10 !w-10 data-[state=active]:text-zinc-300 data-[state=active]:bg-zinc-800 h-full";

const Collections = ({ className, extraElementClassNames, defaultView = "list" }: CollectionsProps) => {
  const [loading, setLoading] = useState(true);
  const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false);
  const [collectionView, setCollectionView] = useState<CollectionView>(defaultView);
  const { setCollections, collections, setInbox } = useCollectionsStore();
  const { profile } = useProfileStore();
  const { font } = profile;
  const navigate = useRouter();

  useEffect(() => {
    (async () => {
      if (profile._id !== "") {
        try {
          setLoading(true);

          if (!collections.length) {
            const response: AxiosResponse = await axios({
              method: "GET",
              url: `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/u/all/${profile._id}`,
              withCredentials: true,
            });

            if (!response || response.status !== 200) {
              toast.error("Failed to fetch user's collections.");
              return;
            }

            const allCollections = response.data.data;
            const inboxCollection = allCollections.find((collection: fetchedCollectionType) => collection.isInbox === true);
            const regularCollections = allCollections.filter((collection: fetchedCollectionType) => collection.isInbox === false);

            setCollections(regularCollections);
            setInbox(inboxCollection)
          }
        } catch (error) {
          if (error instanceof AxiosError) {
            toast.error(error.response?.data.message || error.message)
          } else {
            console.error(error);
            toast.error("Error while fetching collection")
          }
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [collections.length, navigate, profile._id, setCollections, setInbox]);

  if (loading) {
    return (
      <div className="col-span-2 lg:inline-block hidden relative px-7 pb-5 lg:pl-7 lg:pr-4 space-y-3 no-scrollbar max-h-[calc(100vh-5rem)]">
        <div className={`col-span-2 relative lg:px-0 px-4 space-y-3 overflow-y-scroll no-scrollbar h-[calc(100vh-4.5rem)] md:h-auto lg:h-[calc(100vh-4.5rem)] md:space-x-0 md:space-y-2 md:p-4 !gap-2 md:justify-start md:items-start 2xl:grid-cols-1 ${className}`}>
          <Skeleton className={`w-full h-64`} />
          <Skeleton className={`w-full h-64`} />
          <Skeleton className={`w-full h-64`} />
        </div>
      </div>
    );
  }

  if (collections.length == 0 || !collections) {
    if (location.pathname.includes("dashboard")) return
    return (
      <div className={`dark:text-zinc-200 select-none text-zinc-900 h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-5rem)] w-full flex justify-center items-center ${className}`}>
        <p className="text-center pt-24 md:pt-4 lg:pt-0 md:col-span-2 2xl:col-span-3">No Collections found. Please create a new one.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`col-span-2 relative px-7 pb-5 lg:pl-7 space-y-3 no-scrollbar max-h-[calc(100vh-5rem)] ${location.pathname.includes("/dashboard") && "bg-zinc-900 lg:border-r-[1px] lg:!pr-2 lg:pl-3.5 lg:border-zinc-800"}`}>
        <div className={`col-span-2 relative lg:px-0 px-4 space-y-3 overflow-y-scroll no-scrollbar !pr-2 h-[calc(100vh-4.5rem)] md:h-auto lg:h-[calc(100vh-4.5rem)] md:space-x-0 md:space-y-2 md:p-4 !gap-2 md:justify-start md:items-start 2xl:grid-cols-1 ${className}`}>
          <div className={`h-2 md:hidden ${extraElementClassNames}`}></div>
          {(location.pathname.includes("/dashboard") || location.pathname.includes("/c")) && <h2 className="pt-8 pb-3 flex justify-between items-center">
            <span className="text-zinc-100 text-2xl">
              Unpinned
            </span>
            <div className="flex items-center space-x-1">
              <Tabs
                defaultValue="list"
                onValueChange={(value) => setCollectionView(value as CollectionView)}
                className="w-fit"
              >
                <TabsList className="bg-zinc-900">
                  <TabsTrigger
                    className={tabTriggerClass}
                    value="grid"
                    aria-label="Grid View"
                  >
                    <IoGrid />
                  </TabsTrigger>
                  <TabsTrigger
                    className={tabTriggerClass}
                    value="list"
                    aria-label="List View"
                  >
                    <FaThList />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <ResponsiveDialog open={isCollectionFormOpen} onOpenChange={setIsCollectionFormOpen} title="Create a Collection" description="Create a new collection by filling all the fields" trigger={
                <span className="bg-zinc-800 rounded-md cursor-pointer hover:bg-zinc-800/70 text-zinc-100 w-10 h-10 !text-xl !p-0 flex justify-center items-center">
                  <IoMdAdd />
                </span>
              }>
                <CreateCollectionForm afterSubmit={() => setIsCollectionFormOpen(false)} />
              </ResponsiveDialog>
            </div>
          </h2>
          }
          {collectionView === "grid" ? collections.map((collections, index) => (
            <CollectionGridCard
              key={index}
              id={collections._id}
              title={collections.title}
              description={collections.description}
              tagname={collections.tags}
              collaborators={collections.collaborators}
              createdBy={collections.createdBy}
              theme={collections.theme}
              font={font}
            />
          )) : collections.map((collections, index) => (
            <CollectionListCard
              key={index}
              id={collections._id}
              title={collections.title}
              description={collections.description}
              tagname={collections.tags}
              collaborators={collections.collaborators}
              createdBy={collections.createdBy}
              icon={collections.icon}
              theme={collections.theme}
              font={font}
            />
          ))}
          <div className="lg:h-2 h-16 md:hidden"></div>
        </div>
      </div>
    </>
  );
};

export default Collections;
