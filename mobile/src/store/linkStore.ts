import { create } from 'zustand';
import { cachedLinks, fetchedLinkType } from '@/types';

interface LinkState {
  cachedLinks: cachedLinks[];
  setCachedLinks: (collectionId: string, links: fetchedLinkType[]) => void;
  addCachedLinkItem: (collectionId: string, link: fetchedLinkType) => void;
  removeCachedLinkItem: (collectionId: string, linkId: string) => void;
  toggleIsChecked: (collectionId: string, linkId: string) => void;
  reset: () => void;
}

const useLinkStore = create<LinkState>((set) => ({
  cachedLinks: [],

  setCachedLinks: (collectionId, links) =>
    set((state) => {
      const exists = state.cachedLinks.find(
        (c) => c.collectionId === collectionId,
      );
      if (exists) {
        return {
          cachedLinks: state.cachedLinks.map((c) =>
            c.collectionId === collectionId ? { ...c, links } : c,
          ),
        };
      }
      return { cachedLinks: [...state.cachedLinks, { collectionId, links }] };
    }),

  addCachedLinkItem: (collectionId, link) =>
    set((state) => {
      const exists = state.cachedLinks.find(
        (c) => c.collectionId === collectionId,
      );
      if (exists) {
        return {
          cachedLinks: state.cachedLinks.map((c) =>
            c.collectionId === collectionId
              ? { ...c, links: [link, ...c.links] }
              : c,
          ),
        };
      }
      return {
        cachedLinks: [
          ...state.cachedLinks,
          { collectionId, links: [link] },
        ],
      };
    }),

  removeCachedLinkItem: (collectionId, linkId) =>
    set((state) => ({
      cachedLinks: state.cachedLinks.map((c) =>
        c.collectionId === collectionId
          ? { ...c, links: c.links.filter((l) => l._id !== linkId) }
          : c,
      ),
    })),

  toggleIsChecked: (collectionId, linkId) =>
    set((state) => ({
      cachedLinks: state.cachedLinks.map((c) =>
        c.collectionId === collectionId
          ? {
              ...c,
              links: c.links.map((l) =>
                l._id === linkId ? { ...l, isChecked: !l.isChecked } : l,
              ),
            }
          : c,
      ),
    })),

  reset: () => set({ cachedLinks: [] }),
}));

export default useLinkStore;
