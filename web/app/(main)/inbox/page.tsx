"use client";

import { LinkCard } from "@/components/dashboard";
import { colorOptions, fetchedCollectionType } from "@/lib/types";
import useCollectionsStore from "@/store/collectionStore";
import useProfileStore from "@/store/profileStore";
import formatLinks from "@/utils/formatLinks";
import { useUser } from "@clerk/nextjs";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';

const InboxPage = () => {
  const profile = useProfileStore().profile;
  const navigate = useRouter();
  const { inbox, setInboxLink, inboxLinks, setCollections, setInbox, collections } =
    useCollectionsStore();

  const { user } = useUser()

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (!inbox?._id) {
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
        } else {
          const response: AxiosResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/${inbox?._id}`,
            { withCredentials: true }
          );

          if (!response.data.data) {
            toast.error("Failed to fetch collection details");
            return;
          }
          const formattedLinks = formatLinks(response.data.data)
          setInboxLink(formattedLinks);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.message || error.message)
        } else {
          console.error(error);
          toast.error("Error while fetching collections")
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [setInboxLink, inbox?._id, navigate, inboxLinks.length, profile._id, collections.length, setCollections, setInbox, user?.username]);

  if (loading) {
    return (
      <div className="md:h-[calc(100vh-5rem)] h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] overflow-y-scroll w-full space-y-2 no-scrollbar">
        <div className="dark:text-white h-full flex justify-center items-center">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="dark:text-zinc-100 text-zinc-900 no-scrollbar select-none h-[calc(100vh-4.5rem)] overflow-y-scroll"
    >
      <div className="flex justify-center items-center flex-col space-y-12 pt-36">
        <div className="flex justify-center items-center flex-col space-y-3">
          <h1 className="text-5xl font-semibold">Inbox</h1>
          <p
            className="mt-4 text-lg dark:text-zinc-400 text-zinc-500"
          >
            Ready to capture your links?
          </p>
        </div>
      </div>
      <div className="px-4 md:px-24 xl:px-56 2xl-px-64 py-8 pt-24 grid sm:grid-cols-2 gap-2">
        {inboxLinks?.length > 0 ? (
          inboxLinks.map((link) => (
            <LinkCard
              key={link._id}
              id={link._id}
              title={link.title}
              description={link.description}
              createdAt={link.createdAt}
              color={inbox?.theme as colorOptions}
              image={link.image}
              type="todos"
              link={link.link}
              isChecked={link.isChecked}
              contentType={link.contentType}
              collectionId={link.collectionId}
            />
          ))
        ) : (
          <p className="text-lg col-span-2 font-semibold text-center">
            No links found in inbox
          </p>
        )}
      </div>
      <div className="lg:h-2 h-16"></div>
    </div>
  );
};

export default InboxPage;
