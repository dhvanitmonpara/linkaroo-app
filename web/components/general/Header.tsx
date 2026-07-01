"use client";

import { IoMdAdd } from "react-icons/io";
import { IoFilterOutline } from "react-icons/io5";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";
import { CreateCollectionForm, CreateLinkBar, CreateLinkForm } from "@/components/Forms";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import ResponsiveDialog from "./ResponsiveDialog";
import ProfileCard from "./ProfileCard";
import Notifications from "./Notifications";

const Header = () => {
  const [creationTab, setCreationTab] = useState("collection");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navLinkClass = (path: string) =>
    `hover:text-zinc-100 cursor-pointer transition-colors ${pathname === path ? "text-zinc-100" : ""}`;

  return (
    <>
      <nav className="lg:h-[4.5rem] h-16 lg:py-5 pt-4 pb-[1rem] flex justify-between items-center space-x-2 px-5 lg:px-20 border-b-[1px] border-zinc-700 dark:bg-zinc-900 select-none">
        <Link
          href="/"
          className="text-zinc-300 transition-colors cursor-pointer text-2xl font-helvetica font-semibold hover:text-white flex space-x-2 justify-center items-center"
        >
          <img
            src="/linkaroo.png"
            alt="Linkaroo-logo"
            width="24px"
            className="h-[24px] active:animate-spin"
          />
          <span className="hidden sm:inline">Linkaroo</span>
        </Link>
        <div className="lg:h-20 h-[4.5rem] lg:py-5 pt-4 pb-[1rem] flex space-x-2 md:w-2/5">
          <div className="w-full relative hidden md:inline-block h-full">
            <Input
              onClick={() => setOpen(true)}
              className="dark:bg-zinc-800/60 dark:text-white dark:border-zinc-700/80 h-full"
              placeholder="Create or Search something..."
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-2 border-1 bg-zinc-900 border-zinc-700/80 text-zinc-300 w-fit py-1 px-2 text-xs rounded-md">
              ⌘K
            </div>
          </div>
          <ResponsiveDialog
            explicitStates={{ isOpen: dialogOpen, setIsOpen: setDialogOpen }}
            title={`${creationTab === "collection" ? "Create new Collection" : "Add new Link"}`}
            trigger={
              <button className="w-12 transition-colors duration-200 lg:flex hidden justify-center items-center dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-white rounded-sm border-1 dark:border-zinc-700/80 border-zinc-200 hover:bg-zinc-200">
                <IoMdAdd />
              </button>
            }
            className="px-4"
            description={`${creationTab === "collection" ? "Create a new collection" : "Add a new link"} by filling all the required fields`}
            cancelText="Cancel"
          >
            <Tabs
              onValueChange={(value) => setCreationTab(value)}
              value={creationTab}
              className="sm:max-w-96 xl:max-w-lg"
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger className="w-full" value="collection">
                  Collection
                </TabsTrigger>
                <TabsTrigger className="w-full" value="link">
                  Link
                </TabsTrigger>
              </TabsList>
              <TabsContent value="collection">
                <CreateCollectionForm afterSubmit={() => setDialogOpen(false)} />
              </TabsContent>
              <TabsContent value="link">
                <CreateLinkForm afterSubmit={() => setDialogOpen(false)} />
              </TabsContent>
            </Tabs>
          </ResponsiveDialog>
          <ResponsiveDialog
            explicitStates={{ isOpen: open, setIsOpen: setOpen }}
            prebuildForm={false}
            title="Search"
            showCloseButton={false}
            className="sm:max-w-2xl md:max-w-2xl md:p-0 bg-transparent backdrop-blur-md border-none"
            description="search something"
            trigger={
              <div
                onClick={() => setOpen(true)}
                className="md:w-12 cursor-pointer transition-colors duration-200 w-10 text-xl md:text-base md:hidden flex justify-center items-center md:dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-sm md:border-1 md:dark:border-zinc-700/80 md:border-zinc-200 hover:bg-zinc-200"
              >
                <IoSearchSharp />
              </div>
            }
          >
            <div className="w-full flex-1 overflow-auto py-4 lg:py-0">
              <CreateLinkBar />
            </div>
          </ResponsiveDialog>
          <div className="md:w-12 cursor-pointer transition-colors duration-200 w-10 text-xl md:text-base flex justify-center items-center md:dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-white rounded-sm md:border-1 md:dark:border-zinc-700/80 md:border-zinc-200 hover:bg-zinc-200">
            <IoFilterOutline />
          </div>
          <Popover>
            <PopoverTrigger className="md:w-12 cursor-pointer transition-colors duration-200 w-10 text-xl md:text-base hidden lg:flex">
              <div className="w-full h-full flex justify-center items-center text-zinc-400 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-white rounded-sm border-1 dark:border-zinc-700/80 border-zinc-200 hover:bg-zinc-200">
                <IoMdNotificationsOutline />
              </div>
            </PopoverTrigger>
            <PopoverContent className="dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-200 border-zinc-300 text-zinc-950 space-y-2 overflow-y-scroll h-[32rem] p-0">
              <Notifications />
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-zinc-400 md:flex justify-center items-center hidden space-x-7 font-semibold">
          <Link href="/" className={navLinkClass("/")}>
            Home
          </Link>
          <Link href="/dashboard" className={navLinkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/inbox" className={navLinkClass("/inbox")}>
            Inbox
          </Link>
          <div className="hidden lg:inline-block">
            <ProfileCard />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
