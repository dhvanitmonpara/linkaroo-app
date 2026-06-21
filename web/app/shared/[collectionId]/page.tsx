"use client";

import useMethodStore from "@/store/MethodStore";
import useProfileStore from "@/store/profileStore";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, usePathname, useParams } from 'next/navigation';
import { removeUsernameTag } from "@/utils/toggleUsernameInTag";
import useLinkStore from "@/store/linkStore";
import useCollectionsStore from "@/store/collectionStore";
import formatLinks from "@/utils/formatLinks";
import PrivateCollectionGuestView from "@/components/dashboard/PrivateCollectionGuestView";
import { LinkBanner, LinkMapper } from "@/components/dashboard";

const SharedCollectionPage = () => {
  const [loading, setLoading] = useState(false);
  const [doesUserHaveAccess, setDoesUserHaveAccess] = useState(true)

  const { cachedLinks, setLinks, setCurrentCollectionItem, currentCollectionItem } = useLinkStore()
  const { collections } = useCollectionsStore()
  const { profile } = useProfileStore();
  const { currentCardColor } = useMethodStore();

  const { font } = profile;
  const location = usePathname();
  const navigate = useRouter();
  const params = useParams();
  const collectionId = params?.collectionId as string | undefined;

  useEffect(() => {
    (async () => {
      try {

        if (!collectionId || !location.includes("/shared")) {
          navigate.push("/")
          return
        }

        setLoading(true);

        const cache = cachedLinks.filter((link) => link.collectionId === collectionId)[0];

        const currentCollection = collections.find(
          (collection) => collection._id === collectionId
        )

        if (!currentCollection) {

          const response: AxiosResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/u/${collectionId}`,
            { withCredentials: true }
          );

          if (!response.data.data) {
            toast.error("Failed to fetch collection details");
            return;
          }

          const doesUserHaveAccessToManage: boolean =
            (response.data.data.createdBy._id === profile._id) ||
            response.data.data.collaborators.some((collaborator: { _id: string; }) => collaborator._id === profile._id);

          const doesUserHaveAccessToView: boolean =
            response.data.data.viewers.some((collaborator: { _id: string; }) => collaborator._id === profile._id);

          if (doesUserHaveAccessToManage) {
            navigate.replace(`/dashboard/c/${collectionId}`)
          }

          setDoesUserHaveAccess(doesUserHaveAccessToView)
          setCurrentCollectionItem(response.data.data);
        } else {
          setCurrentCollectionItem(currentCollection);
        }

        if (cache) {
          setLinks(cache.links);
        } else {
          const response: AxiosResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/${collectionId}`,
            { withCredentials: true }
          );

          if (!response.data.data) {
            toast.error("Failed to fetch collection details");
            return;
          }

          const formattedLinks = formatLinks(response.data.data)
          setLinks(formattedLinks);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            return
          }
          toast.error(error.message)
        } else {
          console.error(error);
          toast.error("Error while fetching collection details");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [currentCardColor, location, setLinks, setCurrentCollectionItem, navigate, collectionId, cachedLinks, collections, profile._id]);

  const tags: string[] = [];

  currentCollectionItem?.tags?.forEach((tag) => {
    const tagname = removeUsernameTag(tag.tagname);
    if (tagname != undefined) {
      tags.push(tagname);
    }
  })

  if (loading) {
    return (
      <div
        className={`xl:px-0 lg:px-0 lg:pr-5 px-5 h-full select-none lg:col-span-3 xl:col-span-5 pr-5`}
      >
        <div className="md:h-[calc(100vh-5rem)] h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] overflow-y-scroll w-full space-y-2 no-scrollbar">
          <div className="dark:text-white h-full flex justify-center items-center">
            <Loader2 className="animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentCollectionItem?._id) {
    navigate.push("/")
    return
  }

  if (!doesUserHaveAccess && !currentCollectionItem.isPublic) {
    return <PrivateCollectionGuestView />
  }

  return (
    <div
      className={`px-4 md:px-5 h-full w-full max-w-5xl mx-auto select-none`}
    >
      <div className={`md:h-[calc(100vh-5rem)] h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] overflow-y-scroll w-full space-y-2 no-scrollbar ${font}`}>
        <div className="lg:h-2"></div>
        <LinkBanner loading={loading} tags={tags} />
        <LinkMapper />
      </div>
    </div>
  );
};

export default SharedCollectionPage;
