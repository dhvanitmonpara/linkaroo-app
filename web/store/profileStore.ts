import { create } from "zustand";
import { fontOptions, themeType } from "@/lib/types";
import { fetchedTagType } from "@/lib/types";

type User = {
  _id: string;
  username: string;
  email: string;
  theme: themeType;
  useFullTypeFormAdder: boolean;
  isSearchShortcutEnabled: boolean;
  font: fontOptions;
  createdAt: string;
  updatedAt: string;
  _v: number;
};

interface ProfileState {
  profile: User;
  addProfile: (profile: User) => void;
  updateProfile: (updatedProfile: User) => void;
  removeProfile: () => void;
  changeTheme: (theme: themeType) => void;
  toggleIsSearchShortcutEnabled: (value: boolean) => void;
  changeFont: (font: fontOptions) => void;
  toggleUseFullTypeFormAdder: (value: boolean) => void;
  tags: fetchedTagType[] | null;
  setTags: (tags: fetchedTagType[]) => void;
}

const useProfileStore = create<ProfileState>((set) => ({
  profile: {
    _id: "",
    username: "",
    email: "",
    fullName: "",
    avatarImage: "",
    isSearchShortcutEnabled: false,
    useFullTypeFormAdder: false,
    theme: "dark",
    font: "font-poppins",
    createdAt: "",
    updatedAt: "",
    _v: 0,
  } as User,
  addProfile: (profile) => set({ profile }),
  updateProfile: (updatedProfile) =>
    set((state) => ({
      profile: { ...state.profile, ...updatedProfile },
    })),
  removeProfile: () =>
    set({
      profile: {
        _id: "",
        username: "",
        email: "",
        useFullTypeFormAdder: false,
        isSearchShortcutEnabled: false,
        theme: "light",
        font: "font-poppins",
        createdAt: "",
        updatedAt: "",
        _v: 0,
      } as User,
    }),
  changeTheme: (theme: themeType) => {
    set((state) => ({
      profile: { ...state.profile, theme },
    }));
  },
  toggleIsSearchShortcutEnabled: (value: boolean) => {
    set((state) => ({
      profile: {
        ...state.profile,
        isSearchShortcutEnabled: value,
      },
    }));
  },
  toggleUseFullTypeFormAdder: (value: boolean) => {
    set((state) => ({
      profile: {
        ...state.profile,
        useFullTypeFormAdder: value,
      },
    }));
  },
  changeFont: (font: fontOptions) => {
    set((state) => ({
      profile: { ...state.profile, font },
    }));
  },
  tags: null,
  setTags: (tags) => set({ tags }),
}));

export default useProfileStore;
export type { User };
