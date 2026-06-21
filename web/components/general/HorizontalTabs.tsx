"use client";

import { MdHome } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";
import { IoLink, IoPerson } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useProfileStore from "@/store/profileStore";
import {
  CreateLinkForm,
  CreateCollectionForm,
  SettingsForm,
  CreateLinkBar,
} from "@/components/Forms";
import DrawerMenu from "./DrawerMenu";
import { DrawerClose } from "@/components/ui/drawer";
import { IoMdSettings } from "react-icons/io";
import { MdFeedback } from "react-icons/md";
import { FaInfoCircle, FaSearch } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { FaInbox } from "react-icons/fa6";
import { useState } from "react";
import { BsCollectionFill } from "react-icons/bs";
import "./components.css";
import FeedbackForm from "@/components/Forms/FeedbackForm";
import { useClerk } from "@clerk/nextjs";

export default function HorizontalTabs() {
  const { profile } = useProfileStore();
  const { signOut, user } = useClerk();
  const pathname = usePathname();

  const [creationDrawer, setCreationDrawer] = useState(false);
  const [profileDrawer, setProfileDrawer] = useState(false);

  const navClass = (path: string) =>
    `menu-label !text-3xl !w-auto ${pathname === path ? "!text-white" : "!text-zinc-500"}`;

  return (
    <div className="flex md:justify-between justify-evenly dark:bg-zinc-800 w-full px-5 bg-zinc-200 h-full md:px-12 sm:px-2 sm:!rounded-t-xl items-center sm:w-6/12">
      <Link href="/" className={navClass("/")}>
        <MdHome />
      </Link>

      <Link href="/inbox" className={`menu-label !text-2xl !w-auto ${pathname === "/inbox" ? "!text-white" : "!text-zinc-500"}`}>
        <FaInbox />
      </Link>

      {profile.isSearchShortcutEnabled ? (
        <DrawerMenu
          className="dark:bg-zinc-900/70 border-none"
          onClose={() => setCreationDrawer(false)}
          trigger={
            <label
              htmlFor="create-tab"
              className="menu-label !text-2xl bg-transparent !w-auto !text-zinc-500"
            >
              <FaSearch />
            </label>
          }
        >
          <CreateLinkBar />
        </DrawerMenu>
      ) : (
        <DrawerMenu
          open={creationDrawer}
          onOpenChange={() => setCreationDrawer(!creationDrawer)}
          title="Create something"
          contentClassName="!pt-0 px-4"
          trigger={
            <label
              htmlFor="create-tab"
              className="menu-label !text-3xl bg-transparent !w-auto !text-zinc-500"
            >
              <FaPlus />
            </label>
          }
        >
          <div className="w-full space-y-1 rounded-2xl overflow-hidden flex flex-col">
            <DrawerMenu
              contentClassName="px-4"
              onClose={() => setCreationDrawer(false)}
              title="Create a Collection"
              trigger={
                <div className=" flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                  <span className="w-12 h-12 flex justify-center items-center text-xl">
                    <BsCollectionFill />
                  </span>
                  <span>Create a Collection</span>
                </div>
              }
            >
              <CreateCollectionForm />
            </DrawerMenu>
            <DrawerMenu
              contentClassName="px-4"
              onClose={() => setCreationDrawer(false)}
              title="Add a Link"
              trigger={
                <div className=" flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                  <span className="w-12 h-12 flex justify-center items-center text-xl">
                    <IoLink />
                  </span>
                  <span>Add a Link</span>
                </div>
              }
            >
              <CreateLinkForm />
            </DrawerMenu>
          </div>
        </DrawerMenu>
      )}

      <Link
        href="/notifications"
        className={`menu-label !text-3xl !w-auto ${pathname === "/notifications" ? "!text-white" : "!text-zinc-500"}`}
      >
        <IoMdNotifications />
      </Link>

      <DrawerMenu
        title="Profile"
        open={profileDrawer}
        contentClassName="!pt-0 px-4"
        onOpenChange={() => setProfileDrawer(!profileDrawer)}
        trigger={
          <label
            htmlFor="create-tab"
            className="menu-label !text-3xl bg-transparent !w-auto !text-zinc-500"
          >
            <img
              className="rounded-full !h-8 !w-8 object-cover border-zinc-700 border-2 hover:border-zinc-200 transition-colors"
              src={user?.imageUrl}
              alt="Profile pic"
            />
          </label>
        }
      >
        <div className="w-full rounded-2xl overflow-hidden space-y-1 flex flex-col">
          <DrawerClose>
            <div className="flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
              <span className="w-12 h-12 flex justify-center items-center text-xl">
                <IoPerson />
              </span>
              <span>Profile</span>
            </div>
          </DrawerClose>
          <DrawerMenu
            onClose={() => setProfileDrawer(false)}
            title="Create a Collection"
            contentClassName="px-4 pt-0 pb-6"
            trigger={
              <div className="flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                <span className="w-12 h-12 flex justify-center items-center text-xl">
                  <IoMdSettings />
                </span>
                <span>Settings</span>
              </div>
            }
          >
            <SettingsForm />
          </DrawerMenu>
          <DrawerMenu
            onClose={() => setProfileDrawer(false)}
            title="Feedback"
            contentClassName="px-4 pt-0 pb-6"
            trigger={
              <div className="flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                <span className="w-12 h-12 flex justify-center items-center text-xl">
                  <MdFeedback />
                </span>
                <span>Feedback</span>
              </div>
            }
          >
            <FeedbackForm setIsOpen={() => {}} />
          </DrawerMenu>
          <DrawerClose>
            <div className="flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
              <span className="w-12 h-12 flex justify-center items-center text-xl">
                <FaInfoCircle />
              </span>
              <span>About Us</span>
            </div>
          </DrawerClose>
          <DrawerMenu
            onClose={() => setProfileDrawer(false)}
            title="logout"
            contentClassName="!pt-0"
            trigger={
              <div className="flex p-2 justify-normal items-center rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                <span className="w-12 h-12 flex justify-center items-center text-xl">
                  <IoLogOut />
                </span>
                <span>Logout</span>
              </div>
            }
          >
            <div className="px-4 flex flex-col gap-2">
              <button
                onClick={() => signOut()}
                className="w-full block font-semibold py-2 px-4 rounded-md bg-red-500 hover:bg-red-600"
              >
                Logout
              </button>
              <DrawerClose asChild>
                <button className="w-full block font-semibold py-2 px-4 rounded-md bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  Cancel
                </button>
              </DrawerClose>
            </div>
          </DrawerMenu>
        </div>
      </DrawerMenu>
    </div>
  );
}
