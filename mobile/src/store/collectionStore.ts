import { create } from 'zustand';
import { fetchedCollectionType, fetchedLinkType } from '@/types';

interface CollectionsState {
  collections: fetchedCollectionType[];
  setCollections: (collections: fetchedCollectionType[]) => void;
  addCollectionsItem: (item: fetchedCollectionType) => void;
  removeCollectionsItem: (collectionId: string) => void;
  updateCollectionsItem: (collection: fetchedCollectionType) => void;

  inbox: fetchedCollectionType | null;
  inboxLinks: fetchedLinkType[];
  setInbox: (inbox: fetchedCollectionType | null) => void;
  setInboxLinks: (links: fetchedLinkType[]) => void;
  addInboxLinkItem: (link: fetchedLinkType) => void;
  removeInboxLinkItem: (linkId: string) => void;

  reset: () => void;
}

const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  setCollections: (collections) => set({ collections }),
  addCollectionsItem: (collection) =>
    set((state) => ({ collections: [...state.collections, collection] })),
  removeCollectionsItem: (collectionId) =>
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== collectionId),
    })),
  updateCollectionsItem: (collection) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c._id === collection._id ? { ...c, ...collection } : c,
      ),
    })),

  inbox: null,
  inboxLinks: [],
  setInbox: (inbox) => set({ inbox }),
  setInboxLinks: (links) => set({ inboxLinks: links }),
  addInboxLinkItem: (link) =>
    set((state) => ({ inboxLinks: [...state.inboxLinks, link] })),
  removeInboxLinkItem: (linkId) =>
    set((state) => ({
      inboxLinks: state.inboxLinks.filter((l) => l._id !== linkId),
    })),

  reset: () => set({ collections: [], inbox: null, inboxLinks: [] }),
}));

export default useCollectionsStore;
