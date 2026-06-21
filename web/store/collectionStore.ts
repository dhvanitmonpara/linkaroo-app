import { fetchedLinkType, fetchedCollectionType } from "@/lib/types";
import { create } from "zustand";

interface CollectionsState {
  collections: fetchedCollectionType[] | [];
  setCollections: (collections: fetchedCollectionType[]) => void;
  addCollectionsItem: (item: fetchedCollectionType) => void;
  removeCollectionsItem: (collectionId: string) => void;
  updateCollectionsItem: (collection: fetchedCollectionType) => void;
  updateCollectionsTags: (collection: fetchedCollectionType) => void;
  toggleIsPublic: (collection: fetchedCollectionType) => void;
  inbox: fetchedCollectionType | null;
  inboxLinks: fetchedLinkType[] | [];
  setInbox: (inbox: fetchedCollectionType | null) => void;
  setInboxLink: (links: fetchedLinkType[] | []) => void;
  addInboxLinkItem: (link: fetchedLinkType) => void;
  removeInboxLinkItem: (linkId: string) => void;
}

const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  setCollections: (collections) => set({ collections }),
  addCollectionsItem: (collection) => {
    set((state) => ({ collections: [...state.collections, collection] }));
  },
  removeCollectionsItem: (collectionId) => {
    set((state) => ({
      collections: state.collections.filter(
        (collection) => collection._id !== collectionId
      ),
    }));
  },
  updateCollectionsItem: (collection) => {
    set((state) => ({
      collections: state.collections.map((existingCollection) =>
        existingCollection._id === collection._id
          ? { ...existingCollection, ...collection }
          : existingCollection
      ),
    }));
  },
  updateCollectionsTags: (collection) => {
    set((state) => {
      const existingCollectionIndex = state.collections.findIndex(
        (existingCollection) => existingCollection._id === collection._id
      );

      if (existingCollectionIndex !== -1) {
        const updatedCollections = [...state.collections];
        const updatedCollection = {
          ...updatedCollections[existingCollectionIndex],
        };

        updatedCollection.tags = [...collection.tags];

        updatedCollections[existingCollectionIndex] = updatedCollection;

        return { ...state, collections: updatedCollections };
      }

      return state;
    });
  },
  toggleIsPublic: (collection) => {
    set((state) => ({
      collections: state.collections.map((existingCollection) =>
        existingCollection._id === collection._id
          ? { ...existingCollection, isPublic: !collection.isPublic }
          : existingCollection
      ),
    }));
  },
  inbox: null,
  inboxLinks: [],
  setInbox: (inbox) => set({ inbox }),
  setInboxLink: (links) => set({ inboxLinks: links }),
  addInboxLinkItem: (link) => {
    set((state) => ({ inboxLinks: [...state.inboxLinks, link] }));
  },
  removeInboxLinkItem: (linkId) => {
    set((state) => ({
      inboxLinks: state.inboxLinks.filter((doc) => doc._id !== linkId),
    }));
  },
}));

export default useCollectionsStore;
