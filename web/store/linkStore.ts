import {
  cachedLinks,
  fetchedLinkType,
  fetchedCollectionType,
} from "@/lib/types";
import { create } from "zustand";

interface linkState {
  cachedLinks: cachedLinks[] | [];
  setCachedLinks: (links: cachedLinks[]) => void;
  addCachedLinkCollection: (item: cachedLinks) => void;
  removeCachedLinkCollection: (itemId: string) => void;
  replaceCachedLinkCollection: (link: cachedLinks) => void;
  addCachedLinkItem: (collectionId: string, item: fetchedLinkType) => void;
  removeCachedLinkItem: (collectionId: string, linkId: string) => void;
  replaceCachedLinkItem: (collectionId: string, item: fetchedLinkType) => void;
  links: fetchedLinkType[] | [];
  setLinks: (collections: fetchedLinkType[]) => void;
  addLinkItem: (item: fetchedLinkType) => void;
  removeLinkItem: (itemId: string) => void;
  toggleIsChecked: (LinkId: string, isChecked: boolean) => void;
  currentCollectionItem: fetchedCollectionType | null;
  setCurrentCollectionItem: (item: fetchedCollectionType | null) => void;
}

const useLinkStore = create<linkState>((set) => ({
  cachedLinks: [],
  setCachedLinks: (lists) => set({ cachedLinks: lists }),
  addCachedLinkCollection: (list) => {
    set((state) => ({ cachedLinks: [...state.cachedLinks, list] }));
  },
  removeCachedLinkCollection: (collectionId) => {
    set((state) => ({
      cachedLinks: state.cachedLinks.filter(
        (list) => list.collectionId !== collectionId
      ),
    }));
  },
  replaceCachedLinkCollection: (newList) => {
    set((state) => ({
      cachedLinks: state.cachedLinks.map((list) =>
        list.collectionId === newList.collectionId ? newList : list
      ),
    }));
  },
  addCachedLinkItem: (collectionId, item) => {
    set((state) => ({
      cachedLinks: state.cachedLinks.map((list) =>
        list.collectionId === collectionId
          ? { ...list, Links: [...list.links, item] }
          : list
      ),
    }));
  },
  removeCachedLinkItem: (collectionId, linkId) => {
    set((state) => ({
      cachedLinks: state.cachedLinks.map((list) =>
        list.collectionId === collectionId
          ? {
              ...list,
              Links: list.links.filter((link) => link._id !== linkId),
            }
          : list
      ),
    }));
  },
  replaceCachedLinkItem: (collectionId, item) => {
    set((state) => ({
      cachedLinks: state.cachedLinks.map((list) =>
        list.collectionId === collectionId
          ? { ...list, links: [...list.links, item] }
          : list
      ),
    }));
  },
  links: [],
  setLinks: (links) => set({ links }),
  addLinkItem: (collection) => {
    set((state) => ({ links: [...state.links, collection] }));
  },
  removeLinkItem: (linkId) => {
    set((state) => ({
      links: state.links.filter((link) => link._id !== linkId),
    }));
  },
  toggleIsChecked: (linkId, isChecked) => {
    set((state) => ({
      links: state.links.map((existingLink) =>
        existingLink._id === linkId
          ? { ...existingLink, isChecked: !isChecked }
          : existingLink
      ),
    }));
  },
  currentCollectionItem: null,
  setCurrentCollectionItem: (listItem) =>
    set({ currentCollectionItem: listItem }),
}));

export default useLinkStore;
