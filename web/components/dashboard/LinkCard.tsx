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

  const baseCardClass = `block w-full text-foreground select-none group relative flex-col transition-all duration-300 rounded-xl overflow-hidden flex justify-center items-center`;
  const cardClass = `${baseCardClass} ${
    isNote
      ? type === "todos"
        ? "h-auto min-h-[3.5rem] py-3 px-5 border-border/80 bg-muted/60 border-[1px] hover:bg-muted/80 !rounded-3xl"
        : "bg-muted/50 border border-border/60 shadow-sm hover:shadow-md hover:border-border/80 hover:bg-muted/70 !rounded-3xl"
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
                className={`font-semibold decoration-2 cursor-pointer text-lg flex flex-col justify-start items-center w-full`}
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
          <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden sm:rounded-3xl border-border/10 bg-[#0d0e12] text-zinc-300 shadow-2xl p-6 md:p-10 gap-0">
            {/* Top Right Actions */}
            <div className="absolute top-6 right-6 flex items-center space-x-4 z-50">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 md:gap-12 mt-4 w-full">
              
              {/* Left Column */}
              <div className="flex flex-col space-y-6 w-full min-w-0">
                
                {/* Image Box */}
                <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center p-6 overflow-hidden shadow-sm shrink-0">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-zinc-400 font-semibold text-2xl">
                      {isNote ? "Note" : "Link"}
                    </div>
                  )}
                </div>

                {/* Visit Link Button */}
                {isNote === false && (
                  <button 
                    onClick={openLink}
                    className="w-full bg-[#1c1d21] hover:bg-[#25262b] text-zinc-200 py-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-colors shrink-0"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Visit Link</span>
                  </button>
                )}

                {/* URL */}
                {isNote === false && (
                  <div className="flex items-center justify-between text-zinc-500 text-sm px-2 w-full overflow-hidden">
                    <span className="truncate pr-4 min-w-0">{link}</span>
                    <button className="hover:text-zinc-300 transition-colors shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Meta Details */}
                <div className="flex flex-col space-y-4 pt-4 text-sm px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Saved</span>
                    <span className="text-zinc-300">{createdAt ? new Date(createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2"><Tag className="w-4 h-4" /> Type</span>
                    <span className="text-zinc-300">{isNote ? 'Note' : 'Website'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2"><Globe className="w-4 h-4" /> Source</span>
                    <span className="text-zinc-300">Dashboard</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2"><Folder className="w-4 h-4" /> In Collection</span>
                    <span className="text-zinc-300 font-medium">Linkaroo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2"><Circle className="w-4 h-4" /> Added by</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300">User</span>
                      <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">U</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="flex flex-col">
                
                {/* Content Type Badge */}
                <div className="inline-flex items-center gap-2 bg-[#1c1d21] text-zinc-300 px-3 py-1.5 rounded-full text-xs font-medium w-fit mb-6">
                  <Globe className="w-4 h-4" />
                  {isNote ? 'Note' : 'Website'}
                </div>

                {/* Title */}
                <DialogTitle className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight mb-8">
                  {isNote ? (title === 'Quick Note' ? (description || title) : title) : title}
                </DialogTitle>

                {/* Notes Section */}
                {(description || isNote) && (
                  <div className="mb-8">
                    <h3 className="text-zinc-400 text-sm mb-3">Notes</h3>
                    <div className="bg-[#1c1d21] text-zinc-300 p-5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                      {description || (isNote && title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : (description || "No notes available."))}
                    </div>
                  </div>
                )}

                {/* Tags Section */}
                <div className="mb-8">
                  <h3 className="text-zinc-400 text-sm mb-3">Tags</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {['Productivity', 'Research'].map(tag => (
                      <div key={tag} className="bg-[#1c1d21] text-zinc-300 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {tag}
                      </div>
                    ))}
                    <button className="bg-[#1c1d21] hover:bg-[#25262b] text-zinc-300 px-4 py-2 rounded-full text-xs font-medium transition-colors">
                      +
                    </button>
                  </div>
                </div>

                {/* Collection Section */}
                <div className="mb-8">
                  <h3 className="text-zinc-400 text-sm mb-3">Collection</h3>
                  <div className="bg-[#1c1d21] hover:bg-[#25262b] cursor-pointer transition-colors p-4 rounded-xl flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-300">
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
                      <h3 className="text-zinc-400 text-sm">Tasks & Reminders</h3>
                      <span className="bg-[#1c1d21] text-zinc-400 text-xs px-2 py-0.5 rounded-md">2</span>
                    </div>
                    <button className="text-emerald-500 text-sm hover:text-emerald-400 transition-colors font-medium">
                      + Add
                    </button>
                  </div>
                  
                  <div className="bg-[#1c1d21] rounded-xl p-2 flex flex-col gap-1">
                    {[
                      { title: "Review content", date: "Tomorrow" },
                      { title: "Share with team", date: "Next week" }
                    ].map((task, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#25262b] transition-colors group cursor-pointer">
                        <Circle className="w-5 h-5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 text-sm">{task.title}</span>
                        <div className="ml-auto flex items-center gap-3">
                          <div className="text-emerald-500 text-xs flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.date}
                          </div>
                          <MoreVertical className="w-5 h-5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center text-xs text-zinc-600 gap-2">
                  <span>Created: {createdAt ? new Date(createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown'}</span>
                  <span>•</span>
                  <span>Updated: {createdAt ? new Date(createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown'}</span>
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
