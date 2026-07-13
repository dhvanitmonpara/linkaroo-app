/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchedLinkType } from "@/lib/types";

const formatLinks = (links: any) => {
  if (!links || !Array.isArray(links)) return [];
  const formattedLinks: fetchedLinkType[] = links.map((link: any) => {
    return {
      _id: link._id,
      title: link.customTitle || link.linkId?.title || "Unknown Title",
      description: link.customDescription || link.linkId?.description || "",
      link: link.linkId?.link || "",
      collectionId: link.collectionId,
      userId: link.userId,
      isChecked: link.isChecked,
      image: link.linkId?.image || null,
      contentType: link.linkId?.contentType || "link",
      createdAt: link.createdAt || "",
      updatedAt: link.updatedAt || "",
      __v: link.__v || 0,
      tags: link.tags || [],
      tasks: link.tasks || [],
    };
  });
  return formattedLinks;
};


export default formatLinks;
