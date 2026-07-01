"use client";

import { colorOptions } from "@/lib/types";
import { FiArrowUpRight } from "react-icons/fi";
import { BiListPlus } from "react-icons/bi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import useCollectionsStore from "@/store/collectionStore";
import useLinkStore from "@/store/linkStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CustomCheckbox from "@/components/ui/CustomCheckbox";
import { Checkbox } from "@/components/ui/checkbox";
import { usePathname } from "next/navigation";
import React from "react";

type LinkCardProps = {
  id: string;
  title: string;
  color: colorOptions;
  link: string;
  image: string | null;
  type: "banners" | "cards" | "todos";
  isChecked: boolean;
  description?: string;
  createdAt?: string;
};

const LinkCard = ({
  id,
  title,
  color,
  link,
  image,
  type,
  isChecked,
  description,
  createdAt,
}: LinkCardProps) => {
  const { addCachedLinkItem, toggleIsChecked, removeAllLinkItem, removeLinkItem } = useLinkStore();
  const { collections, removeInboxLinkItem } = useCollectionsStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const pathname = usePathname();

  const openLink = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation(); // Prevent the modal from opening
    window.open(link, "_blank");
  };

  const cardClass = `block w-full !text-zinc-300 select-none group relative ${type === "todos" ? "h-14 px-5 border-zinc-800 !bg-zinc-900 border-[1px] hover:!bg-zinc-800/80" : ""} flex-col transition-all duration-300 rounded-md flex justify-center items-center`;

  const addToListHandler = async (collectionId: string) => {
    let loaderId = "";
    try {
      loaderId = toast.loading("Adding to list...");
      const existingList = collections.find(
        (collection) => collection._id === collectionId
      );
      if (!existingList) {
        toast.error("List not found");
        return;
      }

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/move-link`,
        {
          linkId: id,
          collectionId: existingList._id,
        },
        { withCredentials: true }
      );

      if (response.status !== 200) {
        toast.error("Failed to move to list");
        return;
      }

      toast.success(`${title} moved to ${existingList.title} successfully`);
      removeInboxLinkItem(id);
      addCachedLinkItem(collectionId, response.data.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("Error while executing request");
      }
    } finally {
      toast.dismiss(loaderId);
    }
  };

  const deleteLinkHandler = async () => {
    try {
      setIsDeleting(true);
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/${id}`,
        { withCredentials: true }
      );
      if (res.status === 200) {
        toast.success("Link deleted successfully");
        removeAllLinkItem(id);
        removeLinkItem(id);
        removeInboxLinkItem(id);
      }
    } catch (error) {
      toast.error("Failed to delete link");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Dialog>
          <DialogTrigger
            nativeButton={false}
            render={(props) => <div {...props} className={cardClass} />}
          >
            {type === "todos" && (
              <h2
                className={`font-semibold decoration-2 cursor-pointer text-lg flex justify-start items-center w-full space-x-6`}
              >
                <CustomCheckbox
                  color={color}
                  id={id}
                  title={title}
                  defaultChecked={isChecked}
                  onToggle={() => {
                    toggleIsChecked(id, isChecked);
                  }}
                />
                {pathname === "/inbox" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className={`md:opacity-0 absolute text-xl right-16 opacity-100 ${color === "bg-black" ? "hover:bg-[#b2b2b220]" : "hover:bg-[#00000020]"} active:scale-95 rounded-full p-2 group-hover:opacity-100 transition-all ease-in-out duration-300`}
                    >
                      <BiListPlus />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={
                        color === "bg-black"
                          ? "!bg-black !text-white border-zinc-800"
                          : ""
                      }
                    >
                      {collections.length > 0 ? (
                        collections.map((collection) => (
                          <DropdownMenuItem
                            key={collection._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToListHandler(collection._id);
                            }}
                          >
                            {collection.title}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="h-14 flex justify-center items-center">
                          No collections
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <span
                  onClick={openLink}
                  className={`md:opacity-0 absolute right-6 opacity-100 hover:bg-[#b2b2b220] active:scale-95 rounded-full p-2 group-hover:opacity-100 transition-all ease-in-out duration-300`}
                >
                  <FiArrowUpRight />
                </span>
              </h2>
            )}
            {(type === "banners" || type === "cards") && (
              <div
                className={`font-semibold decoration-2 cursor-pointer text-lg flex flex-col justify-start items-center w-full space-y-4`}
              >
                {image && (
                  <img
                    src={image}
                    alt={title}
                    className={`w-full object-cover`}
                  />
                )}
                <h2 className="w-full text-start flex justify-between items-center space-x-2">
                  <span>{title}</span>
                  <div className="flex justify-center items-center transition-all duration-300 opacity-0 group-hover:opacity-100 space-x-2">
                    <Checkbox
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleIsChecked(id, isChecked);
                      }}
                    />
                    <span
                      onClick={openLink}
                      className={`rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all ease-in-out duration-300`}
                    >
                      <FiArrowUpRight />
                    </span>
                  </div>
                </h2>
              </div>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col gap-6">
              {/* Image Banner */}
              {image && (
                <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
              )}

              <DialogHeader className="text-left space-y-3">
                <DialogTitle className="text-2xl font-bold leading-tight">{title}</DialogTitle>
                <div className="flex items-center space-x-2 text-sm text-zinc-500">
                  {createdAt && <span>Added {new Date(createdAt).toLocaleDateString()}</span>}
                </div>
              </DialogHeader>

              {/* Description */}
              {description && (
                <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  {description}
                </div>
              )}

              {/* Link Box */}
              <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="overflow-hidden whitespace-nowrap overflow-ellipsis mr-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Source URL</p>
                  <a href={link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm truncate block">
                    {link}
                  </a>
                </div>
                <button
                  onClick={openLink}
                  className="shrink-0 flex items-center justify-center h-10 w-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiArrowUpRight className="text-lg" />
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 mt-2">
                <button
                  disabled={isDeleting}
                  onClick={deleteLinkHandler}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isDeleting ? "Deleting..." : "Delete Link"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem>Open link</ContextMenuItem>
        <ContextMenuItem>Mark as completed</ContextMenuItem>
        <ContextMenuItem>Move to</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default LinkCard;
