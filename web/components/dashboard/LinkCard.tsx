"use client";

import { colorOptions } from "@/lib/types";
import { FiArrowUpRight, FiTrash2 } from "react-icons/fi";
import { BiListPlus } from "react-icons/bi";
import { Globe, Copy, Folder, Calendar, MoreVertical, Circle, ChevronRight, ExternalLink, Pencil, Trash2, X, Tag } from "lucide-react";
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
  DialogClose,
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

const isNote = contentType === 'note' || title === 'Quick Note';
const isYouTube = contentType === 'youtube' || (link && (link.includes('youtube.com') || link.includes('youtu.be')));

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = isYouTube ? getYouTubeId(link) : null;

  const hasMedia = Boolean(image || isYouTube);
  const baseCardClass = `block w-full text-foreground select-none group relative flex-col transition-all duration-300 rounded-xl overflow-hidden flex justify-center items-center`;

  const cardClass = `${baseCardClass} ${
    isNote
      ? type === "todos"
        ? "h-auto min-h-[3.5rem] py-3 px-5 border-border/80 bg-muted/60 border-[1px] hover:bg-muted/80 !rounded-3xl"
        : "bg-muted/50 border border-border/60 shadow-sm hover:shadow-md hover:border-border/80 hover:bg-muted/70 !rounded-3xl"
      : hasMedia
        ? type === "todos"
          ? "h-14 px-2 bg-transparent hover:bg-muted/30"
          : "bg-transparent hover:bg-muted/30"
        : type === "todos"
          ? "h-14 px-5 border-border bg-muted/50 border-[1px] hover:bg-muted"
          : "bg-muted/40 border border-border/60 shadow-sm hover:shadow-md hover:border-border hover:bg-muted/60"
  }`;

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
      <ContextMenuTrigger className="w-full h-full flex">
        <Dialog>
          <DialogTrigger
            nativeButton={false}
            render={(props) => <div {...props} className={cardClass} />}
          >
            {type === "todos" && (
              <h2
                className={`font-medium decoration-2 cursor-pointer ${isNote ? 'text-lg' : 'text-sm font-normal'} flex justify-start items-center w-full space-x-6`}
              >
                <CustomCheckbox
                  color={color}
                  id={id}
                  title={isNote ? (description ? description.replace(/\n/g, ' ') : (title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link.replace(/\n/g, ' ') : title)) : title}
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
                {isNote === false && (
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
                className={`font-medium decoration-2 cursor-pointer ${isNote ? 'text-lg' : 'text-sm font-normal'} flex flex-col justify-start items-center w-full`}
              >
                {isNote ? (
                  <div className="w-full p-6 flex flex-col justify-between items-start min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-emerald-500/20 to-emerald-300/5 dark:from-emerald-400/20 dark:to-emerald-800/10 rounded-bl-2xl rounded-tr-3xl border-l border-b border-emerald-500/20 dark:border-emerald-500/20" />
                    <p className="text-lg font-medium text-foreground/90 line-clamp-5 w-full text-left whitespace-pre-wrap leading-relaxed relative z-10">
                      {description || (title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : title)}
                    </p>
                    <div className="w-full flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                      <Checkbox
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIsChecked(id, isChecked);
                        }}
                        className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500 dark:data-[state=checked]:text-zinc-900"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {(image || isYouTube) && (
                      <span
                        onClick={openLink}
                        className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all ease-in-out duration-300 opacity-0 group-hover:opacity-100 shadow-sm z-20 hover:scale-105 active:scale-95"
                      >
                        <FiArrowUpRight />
                      </span>
                    )}
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
                    <h2 className={`w-full py-2 px-2 ${(image || isYouTube) ? 'text-center justify-center' : 'text-start justify-between'} flex items-center`}>
                      <span className="truncate">{title}</span>
                      {!(image || isYouTube) && (
                        <div className="flex justify-center items-center transition-all duration-300 opacity-0 group-hover:opacity-100 space-x-2 pl-2">
                          <span
                            onClick={openLink}
                            className={`rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all ease-in-out duration-300`}
                          >
                            <FiArrowUpRight />
                          </span>
                        </div>
                      )}
                    </h2>
                  </>
                )}
              </div>
            )}
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-[95vw] lg:w-[50vw] max-w-[95vw] lg:max-w-[50vw] lg:min-w-[800px] max-h-[90vh] overflow-y-auto overflow-x-hidden sm:rounded-3xl border-white/10 bg-zinc-950 text-zinc-300 shadow-2xl p-6 md:p-12 gap-0">
            {/* Top Right Actions */}
            <div className="absolute top-6 right-6 flex items-center space-x-5 z-50 bg-zinc-950/80 backdrop-blur-sm px-2 py-1 rounded-full">
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Pencil className="w-5 h-5" />
              </button>
              <button 
                onClick={deleteLinkHandler}
                disabled={isDeleting}
                className="text-red-500/70 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-white/10"></div>
              <DialogClose className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none">
                <X className="w-6 h-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 md:gap-12 mt-4 w-full">
              
              {/* Left Column */}
              <div className="flex flex-col space-y-6 w-full min-w-0">
                
                {/* Image Box */}
                <div className={`w-full aspect-video rounded-2xl flex items-center justify-center overflow-hidden shadow-sm shrink-0 ${isYouTube ? '' : 'bg-white/5 p-6'}`}>
                  {isYouTube && youtubeId ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full object-cover rounded-2xl"
                    ></iframe>
                  ) : image ? (
                    <img src={image} alt={title} className="w-full h-full object-contain drop-shadow-sm" />
                  ) : (
                    <div className="text-zinc-500 font-medium text-xl">
                      {isNote ? "Note" : "Link"}
                    </div>
                  )}
                </div>

                {/* Visit Link Button */}
                {isNote === false && (
                  <button 
                    onClick={openLink}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 py-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all shadow-sm ring-1 ring-white/10 shrink-0"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Visit Link</span>
                  </button>
                )}

                {/* URL and Date */}
                {isNote === false && (
                  <div className="flex flex-col space-y-1.5 px-2">
                    <div className="flex items-center justify-between text-zinc-500 text-sm w-full overflow-hidden">
                      <span className="truncate pr-4 min-w-0">{link}</span>
                      <button className="hover:text-zinc-300 transition-colors shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {createdAt && (
                      <div className="text-zinc-600 text-xs">
                        Saved {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}



              </div>

              {/* Right Column */}
              <div className="flex flex-col">
                
                {/* Content Type Badge */}
                <div className="inline-flex items-center gap-2 bg-zinc-900 ring-1 ring-white/10 text-zinc-300 px-3 py-1.5 rounded-full text-xs font-medium w-fit mb-6 shadow-sm">
                  <Globe className="w-4 h-4" />
                  {isNote ? 'Note' : 'Website'}
                </div>

                {/* Title */}
                <DialogTitle className="text-3xl md:text-4xl font-bold text-zinc-50 leading-tight mb-8">
                  {isNote ? (title === 'Quick Note' ? (description || title) : title) : title}
                </DialogTitle>

                {/* Notes Section */}
                {(description || isNote) && (
                  <div className="mb-8">
                    <h3 className="text-zinc-400 text-sm font-medium mb-3">Notes</h3>
                    <div className="bg-zinc-900/50 ring-1 ring-white/5 text-zinc-300 p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                      {description || (isNote && title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : (description || "No notes available."))}
                    </div>
                  </div>
                )}

                {/* Tags Section */}
                <div className="mb-8">
                  <h3 className="text-zinc-400 text-sm font-medium mb-3">Tags</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {['Productivity', 'Research'].map(tag => (
                      <div key={tag} className="bg-zinc-900 ring-1 ring-white/10 hover:ring-white/20 hover:bg-zinc-800 transition-all text-zinc-200 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        {tag}
                      </div>
                    ))}
                    <button className="bg-zinc-900 hover:bg-zinc-800 ring-1 ring-white/10 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm">
                      <span className="text-sm leading-none">+</span>
                    </button>
                  </div>
                </div>

                {/* Collection Section */}
                <div className="mb-8">
                  <h3 className="text-zinc-400 text-sm font-medium mb-3">Collection</h3>
                  <div className="bg-zinc-900/50 hover:bg-zinc-900/80 ring-1 ring-white/5 hover:ring-white/10 cursor-pointer transition-all p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm">
                    <div className="flex items-center gap-3 text-zinc-200 font-medium">
                      <Folder className="w-5 h-5 text-zinc-400" />
                      Linkaroo
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>
                </div>

                {/* Tasks & Reminders Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-zinc-400 text-sm font-medium">Tasks & Reminders</h3>
                      <span className="bg-zinc-800 ring-1 ring-white/10 text-zinc-300 text-xs px-2 py-0.5 rounded-md font-medium">2</span>
                    </div>
                    <button className="text-emerald-500 text-sm hover:text-emerald-400 transition-colors font-medium">
                      + Add
                    </button>
                  </div>
                  
                  <div className="bg-zinc-900/50 ring-1 ring-white/5 rounded-2xl p-2 flex flex-col gap-1 shadow-inner">
                    {[
                      { title: "Review content", date: "Tomorrow" },
                      { title: "Share with team", date: "Next week" }
                    ].map((task, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/80 transition-all group cursor-pointer">
                        <Circle className="w-5 h-5 text-zinc-500 shrink-0 group-hover:text-zinc-400 transition-colors" />
                        <span className="text-zinc-200 text-sm font-medium">{task.title}</span>
                        <div className="ml-auto flex items-center gap-3">
                          <div className="text-emerald-500/90 text-xs flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.date}
                          </div>
                          <MoreVertical className="w-5 h-5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
        {isNote === false && <ContextMenuItem>Open link</ContextMenuItem>}
        <ContextMenuItem>Mark as completed</ContextMenuItem>
        <ContextMenuItem>Move to</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default LinkCard;
