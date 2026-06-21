import { colorOptions, NotificationType } from "@/lib/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MethodState {
  currentCardColor: colorOptions;
  setCurrentCardColor: (color: colorOptions) => void;
  notifications: NotificationType[] | [];
  setNotifications: (notifications: NotificationType[] | []) => void;
  addNotification: (notification: NotificationType) => void;
}

const useMethodStore = create<MethodState>()(
  devtools(
    persist(
      (set) => ({
        currentCardColor: "bg-zinc-200",
        notifications: [],
        setCurrentCardColor: (color) => set({ currentCardColor: color }),
        setNotifications: (notifications) =>
          set({ notifications: notifications }),
        addNotification: (notification) =>
          set((state) => ({
            notifications: [...state.notifications, notification],
          })),
      }),
      {
        name: "methods",
      }
    )
  )
);

export default useMethodStore;
