"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import useMethodStore from "@/store/MethodStore";
import useProfileStore from "@/store/profileStore";
import axios, { AxiosError } from "axios";
import toggleThemeModeAtRootElem from "@/utils/toggleThemeMode";
import { Header, HorizontalTabs, Loading } from "@/components/general";
import { initializeSocket } from "@/utils/initializeSocket";
import { useUser } from "@clerk/nextjs";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded, user } = useUser()

  const [loading, setLoading] = useState<"loading" | "loaded" | "fetched">("loading");
  const navigate = useRouter();

  const {
    notifications,
    setNotifications,
  } = useMethodStore();
  const { addProfile, profile } = useProfileStore();

  useEffect(() => {
    const socket = initializeSocket(profile._id);

    socket.on("userConnected", () => {
      console.log("Socket connected");
    });

    socket.on("pendingNotifications", (newNotifications) => {
      setNotifications([...notifications, ...newNotifications]);
    });

    socket.on("userDisconnected", (data) => {
      console.log(`User ${data.userId} is offline`);
    });

    return () => {
      socket.disconnect();
    };
  }, [profile._id, notifications, setNotifications]);

  useEffect(() => {
    (async () => {
      try {
        if (!isLoaded) {
          if (!isSignedIn) {
            navigate.push("/auth/signin")
          }
          return
        }
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
          navigate.push("/auth/signin")
          return
        }

        const currentUser = await axios({
          method: "GET",
          url: `${process.env.NEXT_PUBLIC_SERVER_API_URL}/users/current/${email}`,
          withCredentials: true,
        });

        if (currentUser.status !== 200) {
          navigate.push("/auth/createuser")
          toast.error("User not found")
          return
        }

        if (currentUser.data.data) {
          addProfile(currentUser.data.data);

          try {
            const tagsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags/get/o/${currentUser.data.data._id}`,
              { withCredentials: true }
            );
            if (tagsResponse.status === 200 && tagsResponse.data?.data) {
              useProfileStore.getState().setTags(tagsResponse.data.data);
            }
          } catch (error) {
            console.error("Failed to fetch user tags in AppLayout", error);
          }
        }
      } catch (error) {
        if (error instanceof AxiosError && (error.status === 404 || error.response?.status === 404 || error.status === 401 || error.response?.status === 401)) {
          navigate.push("/auth/createuser")
        } else {
          console.error(error);
          toast.error("Error while fetching user")
        }
      } finally {
        setLoading("fetched")
        setTimeout(() => setLoading("loaded"), 500)
      }
    })();
  }, [addProfile, isLoaded, isSignedIn, navigate, user?.primaryEmailAddress?.emailAddress]);

  const theme = profile?.theme;

  useEffect(() => {
    toggleThemeModeAtRootElem(theme);
  }, [theme]);

  if (loading !== "loaded") {
    return <Loading isLoading={loading} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <div
        className={`p-0 w-full min-h-[calc(100vh-env(safe-area-inset-top))] ${theme !== "light" ? "text-zinc-100 bg-zinc-950" : "text-zinc-900 bg-zinc-50"} ${profile?.font || ""}`}
      >
        <div
          className="w-full"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <Header />
        </div>
        {children}
      </div>
      <div
        className={`fixed z-30 bottom-0 px-0 ${theme !== "light" ? "text-zinc-400 bg-zinc-950" : "text-zinc-500 bg-zinc-50"} sm:!bg-transparent justify-center items-center flex w-full max-w-full h-16 lg:hidden`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <HorizontalTabs />
      </div>
      <Toaster
        position={window.innerWidth >= 1024 ? "bottom-right" : "top-center"}
        toastOptions={{
          style: {
            background: `${theme !== "light" ? "#333" : "#fff"}`,
            color: `${theme !== "light" ? "#fff" : "#333"}`,
          },
        }}
      />
    </div>
  );
};

export default AppLayout;
