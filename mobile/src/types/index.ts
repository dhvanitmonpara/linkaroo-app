// Mirrored from web/lib/types.ts — shared shape of API entities

type colorOptions =
  | 'bg-zinc-200'
  | 'bg-emerald-400'
  | 'bg-orange-600'
  | 'bg-red-400'
  | 'bg-purple-400'
  | 'bg-pink-400'
  | 'bg-indigo-400'
  | 'bg-teal-400'
  | 'bg-cyan-400'
  | 'bg-amber-400'
  | 'bg-violet-400'
  | 'bg-yellow-400'
  | 'bg-green-400'
  | 'bg-blue-400'
  | 'bg-rose-400'
  | 'bg-sky-400'
  | 'bg-black';

// Maps tailwind class names to actual hex colors for React Native
export const colorMap: Record<colorOptions, string> = {
  'bg-zinc-200': '#e4e4e7',
  'bg-emerald-400': '#34d399',
  'bg-orange-600': '#ea580c',
  'bg-red-400': '#f87171',
  'bg-purple-400': '#c084fc',
  'bg-pink-400': '#f472b6',
  'bg-indigo-400': '#818cf8',
  'bg-teal-400': '#2dd4bf',
  'bg-cyan-400': '#22d3ee',
  'bg-amber-400': '#fbbf24',
  'bg-violet-400': '#a78bfa',
  'bg-yellow-400': '#facc15',
  'bg-green-400': '#4ade80',
  'bg-blue-400': '#60a5fa',
  'bg-rose-400': '#fb7185',
  'bg-sky-400': '#38bdf8',
  'bg-black': '#000000',
};

type themeType = 'light' | 'dark';

type CollectionType =
  | 'movies'
  | 'anime'
  | 'manga'
  | 'books'
  | 'music'
  | 'playlists'
  | 'tv-shows'
  | 'video-games'
  | 'food'
  | 'sports'
  | 'bookmarks'
  | 'cards'
  | 'banners'
  | 'todos';

type Collaborator = {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  imageUrl: string;
  clerkId: string;
};

type TagType = {
  _id: string;
  tagname: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

type fetchedTagType = {
  __v: number;
  _id: string;
  createdAt: string;
  owner: string;
  tagname: string;
  updatedAt: string;
};

type ContentType =
  | 'youtube'
  | 'twitter'
  | 'github'
  | 'instagram'
  | 'image'
  | 'audio'
  | 'article'
  | 'book'
  | 'movie'
  | 'product'
  | 'link';

type fetchedLinkType = {
  _id: string;
  title: string;
  description: string;
  link: string;
  userId: string;
  image: null | string;
  collectionId: string;
  createdAt: string;
  isChecked: boolean;
  updatedAt: string;
  __v: number;
  contentType?: ContentType;
};

type fetchedCollectionType = {
  _id: string;
  collaborators: Collaborator[];
  viewers: Collaborator[];
  createdBy: Collaborator;
  description: string;
  tags: TagType[];
  isInbox: boolean;
  theme: colorOptions;
  isPublic: boolean;
  title: string;
  type: CollectionType;
  icon: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
};

type cachedLinks = {
  collectionId: string;
  links: fetchedLinkType[];
};

type UserProfile = {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarImage?: string;
  theme: themeType;
  useFullTypeFormAdder: boolean;
  isSearchShortcutEnabled: boolean;
  font: string;
  createdAt: string;
  updatedAt: string;
  _v: number;
};

export type {
  colorOptions,
  themeType,
  TagType,
  fetchedCollectionType,
  Collaborator,
  fetchedLinkType,
  fetchedTagType,
  cachedLinks,
  CollectionType,
  UserProfile,
  ContentType,
};
