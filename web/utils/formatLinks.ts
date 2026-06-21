/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchedLinkType } from "@/lib/types";

const formatLinks = (links: any) => {
  const formattedLinks: fetchedLinkType[] = links.map((link: any) => {
    return {
      _id: link._id,
      title: link.customTitle || link.linkId.title,
      description: link.customDescription || link.linkId.description,
      link: link.linkId.link,
      collectionId: link.collectionId,
      userId: link.userId,
      isChecked: link.isChecked,
      image: link.linkId.image,
    };
  });
  return formattedLinks;
};

export default formatLinks;
