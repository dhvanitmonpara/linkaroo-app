"use client";

import { colorOptions } from "@/lib/types";
import { FiArrowUpRight, FiTrash2 } from "react-icons/fi";
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
  contentType?: string;
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
  contentType,
}: LinkCardProps) => {
  const { addCachedLinkItem, toggleIsChecked, removeAllLinkItem, removeLinkItem } = useLinkStore();
  const { collections, removeInboxLinkItem } = useCollectionsStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const pathname = usePathname();

  const openLink = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation(); // Prevent the modal from opening
    window.open(link, "_blank");
  };

  const cardClass = `block w-full text-foreground select-none group relative ${type === "todos" ? "h-14 px-5 border-border bg-muted/50 border-[1px] hover:bg-muted" : "bg-muted/40 border border-border/60 shadow-sm hover:shadow-md hover:border-border hover:bg-muted/60"} flex-col transition-all duration-300 rounded-xl overflow-hidden flex justify-center items-center`;

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
                {contentType !== 'note' && (
                  <span
                    onClick={openLink}
                    className={`md:opacity-0 absolute right-6 opacity-100 hover:bg-[#b2b2b220] active:scale-95 rounded-full p-2 group-hover:opacity-100 transition-all ease-in-out duration-300`}
                  >
                    <FiArrowUpRight />
                  </span>
                )}
              </h2>
            )}
            {(type === "banners" || type === "cards") && (
              <div
                className={`font-semibold decoration-2 cursor-pointer text-lg flex flex-col justify-start items-center w-full`}
              >
                {contentType === 'note' ? (
                  <div className="w-full p-4 flex flex-col justify-between items-start min-h-[120px]">
                    <p className="text-sm font-normal text-foreground line-clamp-5 w-full text-left whitespace-pre-wrap leading-relaxed">
                      {description}
                    </p>
                    <div className="w-full flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Checkbox
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIsChecked(id, isChecked);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {image && (
                      <div className={`w-full border-b border-border/50 flex justify-center ${contentType === 'github-profile' ? 'bg-muted/40 py-6' : ''}`}>
                        <img
                          src={image}
                          alt={title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                          className={contentType === 'github-profile' ? 'w-24 h-24 object-cover rounded-full shadow-sm ring-4 ring-background' : 'w-full object-cover max-h-48 aspect-video'}
                        />
                      </div>
                    )}
                    <h2 className="w-full p-4 text-start flex justify-between items-center space-x-2">
                      <span className="truncate">{title}</span>
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
                  </>
                )}
              </div>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-0 gap-0">
            {/* Image Banner */}
            {image && (
              <div className={`w-full h-48 md:h-72 relative flex justify-center items-center ${contentType === 'github-profile' ? 'bg-gradient-to-b from-muted/60 to-background' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10 pointer-events-none" />
                <img 
                  src={image} 
                  alt={title} 
                  className={contentType === 'github-profile' ? 'w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-xl z-20 relative ring-4 ring-background' : 'w-full h-full object-cover'} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className={`p-6 md:p-8 flex flex-col gap-6 ${image ? '-mt-24 relative z-20' : 'pt-8'}`}>
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-foreground drop-shadow-sm">{title}</DialogTitle>
                {createdAt && (
                  <div className="text-sm font-medium text-muted-foreground/80">
                    Added {new Date(createdAt).toLocaleDateString()}
                  </div>
                )}
              </DialogHeader>

              {/* Description */}
              {description && (
                <div className="text-foreground/90 text-base md:text-lg leading-relaxed bg-muted/30 p-5 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
                  {description}
                </div>
              )}

              {/* Link Box */}
              {contentType !== 'note' && (
                <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/20 rounded-2xl border border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <div className="overflow-hidden mr-4">
                    <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <FiArrowUpRight className="w-3.5 h-3.5" /> Source URL
                    </p>
                    <a href={link} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 font-medium text-sm md:text-base block break-all transition-colors line-clamp-1">
                      {link}
                    </a>
                  </div>
                  <button
                    onClick={openLink}
                    className="shrink-0 flex items-center justify-center h-12 w-12 bg-background shadow-sm border border-border/50 rounded-full group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                  >
                    <FiArrowUpRight className="text-xl" />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={isDeleting}
                  onClick={deleteLinkHandler}
                  className="px-5 py-2.5 text-sm font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiTrash2 className="w-4.5 h-4.5" />
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
