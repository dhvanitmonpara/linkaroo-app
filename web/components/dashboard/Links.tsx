"use client";

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
import { DashboardWelcomeScreen, LinkBanner, LinkMapper } from "@/components/dashboard/index"

const Links = () => {
  const [loading, setLoading] = useState(true)

  const { cachedLinks, setLinks, addCachedLinkCollection, setCurrentCollectionItem, currentCollectionItem } = useLinkStore()
  const { collections } = useCollectionsStore()
  const { profile } = useProfileStore();

  const { font } = profile;
  const location = usePathname();
  const navigate = useRouter();
  const params = useParams();
  const collectionId = params?.collectionId as string | undefined;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (!location.includes("/c")) {
          return
        }
        if (!collectionId) {
          navigate.push("/dashboard")
          return
        }

        const cache = cachedLinks.filter((collection) => collection.collectionId === collectionId)[0];

        const currentCollectionRes = collections.find(
          (collection) => collection._id === collectionId
        )
        if (!currentCollectionRes) {
          navigate.push("/dashboard")
          return
        }

        setCurrentCollectionItem(currentCollectionRes);

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
          addCachedLinkCollection({ collectionId, links: formattedLinks });
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            setLinks([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, setLinks, setCurrentCollectionItem, addCachedLinkCollection, navigate, collectionId]);

  const tags: string[] = [];

  currentCollectionItem?.tags?.forEach((tag) => {
    const tagname = removeUsernameTag(tag.tagname);
    if (tagname != undefined) {
      tags.push(tagname);
    }
  });

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
    if (collections.length > 0) {
      navigate.replace(`/dashboard/c/${collections[0]._id}`)
      return null
    } else {
      return <DashboardWelcomeScreen />
    }
  }

  return (
    <div
      className={`lg:pl-0 px-5 h-full select-none col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 pr-5 w-full min-w-0 max-w-full overflow-hidden`}
    >
      <div className={`md:h-[calc(100vh-5rem)] lg:px-0 px-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] overflow-y-auto w-full max-w-full space-y-2 no-scrollbar ${font}`}>
        <div className="lg:h-2"></div>
        <LinkBanner loading={loading} tags={tags} key={currentCollectionItem._id} />
        <LinkMapper />
      </div>
    </div>
  );
};

export default Links;
