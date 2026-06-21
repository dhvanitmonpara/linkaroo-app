"use client";

import useLinkStore from "@/store/linkStore";

function PrivateCollectionGuestView() {
  const { currentCollectionItem } = useLinkStore();

  return <div>{currentCollectionItem?.title}</div>;
}

export default PrivateCollectionGuestView;
