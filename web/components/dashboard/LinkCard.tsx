"use client";

import { colorOptions, fetchedTagType, TaskType } from "@/lib/types";
import { FiArrowUpRight } from "react-icons/fi";
import { BiListPlus } from "react-icons/bi";
import {
  Globe, Copy, Folder, Calendar, Circle, CheckCircle2,
  ExternalLink, Trash2, X, Plus, Check, Tag as TagIcon, FileText
} from "lucide-react";

const PdfViewer = ({ link, title }: { link: string; title: string }) => {
  const [viewMode, setViewMode] = React.useState<'mozilla' | 'google' | 'direct'>('mozilla');
  const [isLoading, setIsLoading] = React.useState(true);

  const getPdfSrc = () => {
    switch (viewMode) {
      case 'mozilla':
        return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(link)}`;
      case 'google':
        return `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`;
      case 'direct':
      default:
        return link;
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden relative group shadow-inner">
      {/* Minimal Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 backdrop-blur border-b border-white/10 text-xs text-zinc-400 shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-200 truncate max-w-[180px] md:max-w-[280px]">{title}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => { setIsLoading(true); setViewMode('mozilla'); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                viewMode === 'mozilla' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'hover:text-zinc-200'
              }`}
              title="Fast Mozilla PDF.js Engine"
            >
              PDF.js
            </button>
            <button
              onClick={() => { setIsLoading(true); setViewMode('google'); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                viewMode === 'google' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'hover:text-zinc-200'
              }`}
              title="Google Docs Cloud Engine"
            >
              Google
            </button>
            <button
              onClick={() => { setIsLoading(true); setViewMode('direct'); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                viewMode === 'direct' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'hover:text-zinc-200'
              }`}
              title="Direct Native Viewer"
            >
              Direct
            </button>
          </div>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Open PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Iframe Viewer Container */}
      <div className="relative w-full flex-1 bg-zinc-900 min-h-[460px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs text-zinc-400 font-medium">Streaming PDF...</span>
            </div>
          </div>
        )}
        <iframe
          src={getPdfSrc()}
          title={title}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full min-h-[460px] border-0 rounded-b-2xl"
        />
      </div>
    </div>
  );
};
import TextareaAutosize from 'react-textarea-autosize';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import useCollectionsStore from "@/store/collectionStore";
import useLinkStore from "@/store/linkStore";
import useProfileStore from "@/store/profileStore";
import {
  Dialog,
  DialogContent,
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
  collectionId?: string;
  tags?: fetchedTagType[];
  tasks?: TaskType[];
};

const MediaImageWithFallback = ({
  link,
  image,
  title,
  contentType,
  className,
  containerClassName,
  isDialog = false,
}: {
  link?: string;
  image?: string | null;
  title: string;
  contentType?: string;
  className?: string;
  containerClassName?: string;
  isDialog?: boolean;
}) => {
  const isValidUrl = Boolean(link && (link.startsWith("http://") || link.startsWith("https://")));
  const isPDF = contentType === 'pdf' || Boolean(link && link.toLowerCase().includes('.pdf'));

  const targetUrlForScreenshot = isPDF && isValidUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(link!)}`
    : link;

  const screenshotUrl = isValidUrl
    ? `https://api.microlink.io/?url=${encodeURIComponent(targetUrlForScreenshot!)}&screenshot=true&meta=false&embed=screenshot.url`
    : null;

  const [currentSrc, setCurrentSrc] = React.useState<string | null>(screenshotUrl || image || null);
  const [attemptedScreenshot, setAttemptedScreenshot] = React.useState<boolean>(Boolean(screenshotUrl));
  const [hasFailed, setHasFailed] = React.useState<boolean>(false);

  React.useEffect(() => {
    const targetUrl = isPDF && isValidUrl
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(link!)}`
      : link;

    const initialScreenshotUrl = isValidUrl
      ? `https://api.microlink.io/?url=${encodeURIComponent(targetUrl!)}&screenshot=true&meta=false&embed=screenshot.url`
      : null;

    setCurrentSrc(initialScreenshotUrl || image || null);
    setAttemptedScreenshot(Boolean(initialScreenshotUrl));
    setHasFailed(false);
  }, [link, image, isValidUrl, isPDF]);

  const handleError = () => {
    if (attemptedScreenshot && image && currentSrc !== image) {
      // Screenshot failed -> fallback to OG image
      setAttemptedScreenshot(false);
      setCurrentSrc(image);
    } else {
      // OG image also failed or unavailable
      setHasFailed(true);
    }
  };

  if (hasFailed || !currentSrc) {
    if (isDialog) {
      return (
        <div className="text-zinc-500 font-medium text-xl h-full flex items-center justify-center">
          {isPDF ? "PDF Document" : "Link"}
        </div>
      );
    }
    if (isPDF) {
      return (
        <div className={containerClassName}>
          <div className="w-full aspect-[1/1.414] max-h-64 bg-gradient-to-br from-red-500/10 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center border-b border-border/50 relative overflow-hidden">
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider">
              PDF (A4)
            </div>
            <FileText className="w-12 h-12 text-red-400/80 mb-2" />
            <span className="text-xs text-zinc-400 font-medium max-w-[80%] truncate text-center">
              {title || "PDF Document"}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={containerClassName}>
      <img
        src={currentSrc}
        alt={title}
        onError={handleError}
        className={className}
      />
    </div>
  );
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
  collectionId,
  tags: initialTags = [],
  tasks: initialTasks = [],
}: LinkCardProps) => {
  const { addCachedLinkItem, toggleIsChecked, removeAllLinkItem, removeLinkItem, updateLinkItem } = useLinkStore();
  const { collections, removeInboxLinkItem } = useCollectionsStore();
  const { tags: userTags, setTags, profile } = useProfileStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const pathname = usePathname();

  // Editable state
  const [editTitle, setEditTitle] = React.useState(title);
  const [editDescription, setEditDescription] = React.useState(description || "");
  const [currentCollectionId, setCurrentCollectionId] = React.useState(collectionId || "");
  const [currentTags, setCurrentTags] = React.useState<fetchedTagType[]>(initialTags);
  const [currentTasks, setCurrentTasks] = React.useState<TaskType[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [showTagDropdown, setShowTagDropdown] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);
  const [tagSearchQuery, setTagSearchQuery] = React.useState("");
  const [isCreatingCollection, setIsCreatingCollection] = React.useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = React.useState("");
  const [savingField, setSavingField] = React.useState<string | null>(null);
  const tagDropdownRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync prop changes
  React.useEffect(() => {
    setEditTitle(title);
    setEditDescription(description || "");
    setCurrentCollectionId(collectionId || "");
  }, [id, title, description, collectionId]);

  React.useEffect(() => {
    setCurrentTags(initialTags);
  }, [JSON.stringify(initialTags)]);

  React.useEffect(() => {
    setCurrentTasks(initialTasks);
  }, [JSON.stringify(initialTasks)]);

  // Close tag dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
        setIsCreatingTag(false);
        setNewTagName("");
        setTagSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    // Other effects can go here if needed, but resizeTitle is removed
  }, [editTitle]);

  const filteredUserTags = React.useMemo(() => {
    if (!userTags) return [];
    if (!tagSearchQuery.trim()) return userTags;
    return userTags.filter(tag => tag.tagname.toLowerCase().includes(tagSearchQuery.toLowerCase()));
  }, [userTags, tagSearchQuery]);

  const patchLink = async (updates: Record<string, unknown>) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/${id}`,
        updates,
        { withCredentials: true }
      );
      if (res.status === 200) {
        // Refresh tasks from server response so IDs are real
        if (updates.tasks !== undefined && res.data?.data?.tasks) {
          setCurrentTasks(res.data.data.tasks);
        }
        updateLinkItem(id, updates as Parameters<typeof updateLinkItem>[1]);
      }
      return res;
    } catch {
      toast.error("Failed to save changes");
    }
  };

  // Auto-save title on blur
  const handleTitleBlur = async () => {
    if (editTitle === title) return;
    setSavingField("title");
    await patchLink({ title: editTitle });
    setSavingField(null);
  };

  // Auto-save description on blur
  const handleDescriptionBlur = async () => {
    if (editDescription === (description || "")) return;
    setSavingField("description");
    await patchLink({ description: editDescription });
    setSavingField(null);
  };

  // Save collection on select
  const handleCollectionChange = async (newId: string | null) => {
    if (!newId) return;
    if (newId === "__new__") {
      setIsCreatingCollection(true);
      return;
    }
    setCurrentCollectionId(newId);
    setSavingField("collection");
    await patchLink({ collectionId: newId });
    setSavingField(null);
  };

  // Create new collection and attach it
  const handleCreateCollection = async () => {
    if (!newCollectionTitle.trim()) return;
    setSavingField("collection");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections`,
        { title: newCollectionTitle.trim(), isPublic: false, description: "", tags: [], createdById: profile?._id },
        { withCredentials: true }
      );
      const created = res.data;
      useCollectionsStore.getState().addCollectionsItem(created);
      setCurrentCollectionId(created._id);
      await patchLink({ collectionId: created._id });
      setNewCollectionTitle("");
      setIsCreatingCollection(false);
      toast.success(`Collection "${created.title}" created`);
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setSavingField(null);
    }
  };

  // Toggle tag
  const handleTagToggle = async (tag: fetchedTagType) => {
    const isActive = currentTags.some(t => t.tagname === tag.tagname);
    const newTags = isActive
      ? currentTags.filter(t => t.tagname !== tag.tagname)
      : [...currentTags, tag];
    setCurrentTags(newTags);
    await patchLink({ tags: newTags });
  };

  // Create new tag and attach it
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setSavingField("tag");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags`,
        { tagname: newTagName.trim(), ownerId: profile?._id || "00000000-0000-0000-0000-000000000000" },
        { withCredentials: true }
      );
      const created: fetchedTagType = res.data;
      const newTags = [...currentTags, created];
      setCurrentTags(newTags);
      if (userTags) setTags([...userTags, created]);
      await patchLink({ tags: newTags });
      setNewTagName("");
      setIsCreatingTag(false);
      toast.success(`Tag "${created.tagname}" created`);
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setSavingField(null);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  // Add task (optimistic then persist)
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const optimisticTask: TaskType = {
      _id: crypto.randomUUID(),
      userLinkId: id,
      title: newTaskTitle.trim(),
      date: "",
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newTasks = [...currentTasks, optimisticTask];
    setCurrentTasks(newTasks);
    setNewTaskTitle("");
    setIsAddingTask(false);
    // Send to backend — server will recreate fresh with real IDs, update from response
    await patchLink({ tasks: newTasks });
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: string) => {
    const newTasks = currentTasks.map(t =>
      t._id === taskId ? { ...t, completed: !t.completed } : t
    );
    setCurrentTasks(newTasks);
    await patchLink({ tasks: newTasks });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    const newTasks = currentTasks.filter(t => t._id !== taskId);
    setCurrentTasks(newTasks);
    await patchLink({ tasks: newTasks });
  };

  const openLink = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    window.open(link, "_blank");
  };

  const isNote = contentType === 'note' || title === 'Quick Note';
  const isPDF = contentType === 'pdf' || (Boolean(link) && link.toLowerCase().includes('.pdf'));
  const isYouTube = contentType === 'youtube' || (link && (link.includes('youtube.com') || link.includes('youtu.be')));

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = isYouTube ? getYouTubeId(link) : null;

  const hasMedia = Boolean((link && !isNote) || image || isYouTube);
  const baseCardClass = `block w-full text-foreground select-none group relative flex-col transition-all duration-300 rounded-xl overflow-hidden flex justify-center items-center`;

  const cardClass = `${baseCardClass} ${isNote
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

  const addToListHandler = async (targetCollectionId: string) => {
    let loaderId = "";
    try {
      loaderId = toast.loading("Adding to list...");
      const existingList = collections.find(c => c._id === targetCollectionId);
      if (!existingList) { toast.error("List not found"); return; }
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/move-link`,
        { linkId: id, collectionId: existingList._id },
        { withCredentials: true }
      );
      if (response.status !== 200) { toast.error("Failed to move to list"); return; }
      toast.success(`${title} moved to ${existingList.title} successfully`);
      removeInboxLinkItem(id);
      addCachedLinkItem(targetCollectionId, response.data.data);
    } catch (error) {
      if (error instanceof AxiosError) toast.error(error.message);
      else toast.error("Error while executing request");
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
    } catch {
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
              <h2 className={`font-medium decoration-2 cursor-pointer ${isNote ? 'text-lg' : 'text-sm font-normal'} flex justify-start items-center w-full space-x-6`}>
                <CustomCheckbox
                  color={color}
                  id={id}
                  title={isNote ? (description ? description.replace(/\n/g, ' ') : (title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link.replace(/\n/g, ' ') : title)) : title}
                  defaultChecked={isChecked}
                  onToggle={() => toggleIsChecked(id, isChecked)}
                />
                {pathname === "/inbox" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className={`md:opacity-0 absolute text-xl right-16 opacity-100 ${color === "bg-black" ? "hover:bg-[#b2b2b220]" : "hover:bg-[#00000020]"} active:scale-95 rounded-full p-2 group-hover:opacity-100 transition-all ease-in-out duration-300`}
                    >
                      <BiListPlus />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={color === "bg-black" ? "!bg-black !text-white border-zinc-800" : ""}>
                      {collections.length > 0 ? (
                        collections.map((collection) => (
                          <DropdownMenuItem
                            key={collection._id}
                            onClick={(e) => { e.stopPropagation(); addToListHandler(collection._id); }}
                          >
                            {collection.title}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="h-14 flex justify-center items-center text-sm">No collections</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isNote === false && (
                  <span onClick={openLink} className="md:opacity-0 absolute right-6 opacity-100 hover:bg-[#b2b2b220] active:scale-95 rounded-full p-2 group-hover:opacity-100 transition-all ease-in-out duration-300">
                    <FiArrowUpRight />
                  </span>
                )}
              </h2>
            )}
            {(type === "banners" || type === "cards") && (
              <div className={`font-medium decoration-2 cursor-pointer ${isNote ? 'text-lg' : 'text-sm font-normal'} flex flex-col justify-start items-center w-full`}>
                {isNote ? (
                  <div className="w-full p-6 flex flex-col justify-between items-start min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-emerald-500/20 to-emerald-300/5 dark:from-emerald-400/20 dark:to-emerald-800/10 rounded-bl-2xl rounded-tr-3xl border-l border-b border-emerald-500/20 dark:border-emerald-500/20" />
                    <p className="text-lg font-medium text-foreground/90 line-clamp-5 w-full text-left whitespace-pre-wrap leading-relaxed relative z-10">
                      {description || (title === 'Quick Note' && link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : title)}
                    </p>
                    <div className="w-full flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                      <Checkbox
                        onClick={(e) => { e.stopPropagation(); toggleIsChecked(id, isChecked); }}
                        className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500 dark:data-[state=checked]:text-zinc-900"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {hasMedia && (
                      <span onClick={openLink} className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all ease-in-out duration-300 opacity-0 group-hover:opacity-100 shadow-sm z-20 hover:scale-105 active:scale-95">
                        <FiArrowUpRight />
                      </span>
                    )}
                    {isYouTube && youtubeId ? (
                      <div className="w-full border-b border-border/50 flex justify-center">
                        <img
                          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                          alt={title}
                          className="w-full object-cover max-h-48 aspect-video"
                        />
                      </div>
                    ) : (
                      <MediaImageWithFallback
                        link={link}
                        image={image}
                        title={title}
                        contentType={contentType}
                        containerClassName={`w-full border-b border-border/50 flex justify-center ${contentType === 'github-profile' ? 'bg-muted/40 py-6' : ''}`}
                        className={contentType === 'github-profile' ? 'w-24 h-24 object-cover rounded-full shadow-sm ring-4 ring-background' : isPDF ? 'w-full object-cover max-h-64 aspect-[1/1.414] object-top' : 'w-full object-cover max-h-48 aspect-video'}
                      />
                    )}
                    <h2 className={`w-full py-2 px-2 text-center justify-center flex items-center`}>
                      <span className="truncate">{title}</span>
                    </h2>
                  </>
                )}
              </div>
            )}
          </DialogTrigger>

          <DialogContent
            showCloseButton={false}
            className="w-[85vw] lg:w-[60vw] max-w-[85vw] lg:max-w-[60vw] lg:min-w-[900px] max-h-[80vh] overflow-y-auto overflow-x-hidden sm:rounded-3xl border-white/10 bg-zinc-950 text-zinc-300 shadow-2xl p-6 md:p-12 gap-0"
          >
            {/* Top Right Actions */}
            <div className="absolute top-6 right-6 flex items-center space-x-2 z-50">
              <button
                onClick={deleteLinkHandler}
                disabled={isDeleting}
                className="text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-50 p-2 hover:bg-white/5 rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <DialogClose className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-8 md:gap-12 mt-4 w-full">

              {/* Left Column */}
              <div className="flex flex-col space-y-3 w-full min-w-0">

                {/* Media Box */}
                <div className={`w-full ${isPDF ? 'h-[500px]' : 'aspect-video'} rounded-2xl flex items-start justify-center overflow-y-auto overflow-x-hidden shadow-sm shrink-0 no-scrollbar ${isYouTube || isPDF ? '' : 'bg-white/5'}`}>
                  {isYouTube && youtubeId ? (
                    <iframe width="100%" height="100%"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={title} frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : isPDF && link ? (
                    <PdfViewer link={link} title={title} />
                  ) : !isNote && link ? (
                    <MediaImageWithFallback
                      link={link}
                      image={image}
                      title={title}
                      contentType={contentType}
                      isDialog={true}
                      containerClassName="w-full h-full flex items-start justify-center"
                      className="w-full h-auto object-top bg-white"
                    />
                  ) : image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-500 font-medium text-xl h-full flex items-center justify-center">
                      {isNote ? "Note" : "Link"}
                    </div>
                  )}
                </div>

                {/* Visit Link & Meta */}
                {!isNote && (
                  <div className="flex flex-col space-y-2 px-1 pt-1">
                    <div className="flex items-center justify-between">
                      <button onClick={openLink} className="text-zinc-400 hover:text-zinc-200 text-sm font-medium flex items-center space-x-1.5 transition-colors group">
                        <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Visit original link</span>
                      </button>
                      <button onClick={handleCopyLink} className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 px-2 py-1 rounded">
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 text-xs w-full overflow-hidden">
                      <span className="truncate pr-4 min-w-0">{link}</span>
                      {createdAt && (
                        <span className="shrink-0 whitespace-nowrap">
                          {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="flex flex-col">

                {/* Content Type Badge */}
                <div className="inline-flex items-center gap-1.5 text-zinc-400 text-sm font-medium w-fit mb-4">
                  {isPDF ? <FileText className="w-4 h-4 text-emerald-400" /> : <Globe className="w-4 h-4" />}
                  {isNote ? 'Note' : isPDF ? 'PDF Document' : 'Website'}
                </div>

                {/* Title — auto-resizing textarea */}
                <DialogTitle className="text-2xl md:text-3xl font-semibold text-zinc-100 leading-tight mb-2 p-0 flex">
                  <TextareaAutosize
                    ref={titleRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    minRows={1}
                    className="w-full bg-transparent resize-none focus:outline-none text-zinc-100 placeholder-zinc-600 hover:bg-white/5 focus:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors leading-tight text-2xl md:text-3xl font-semibold overflow-hidden"
                    placeholder="Untitled"
                  />
                </DialogTitle>
                {savingField === "title" && <span className="text-emerald-500 text-xs mb-2 block">Saving...</span>}

                {/* Notes — textarea, auto-save */}
                <div className="mb-6 mt-4">
                  <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Notes</h3>
                  <TextareaAutosize
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    minRows={3}
                    className="w-full bg-transparent resize-none focus:outline-none text-zinc-300 text-sm leading-relaxed placeholder-zinc-600 hover:bg-white/5 focus:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors overflow-hidden"
                    placeholder="Add a note..."
                  />
                  {savingField === "description" && <span className="text-emerald-500 text-xs block">Saving...</span>}
                </div>

                {/* Tags Section */}
                <div className="mb-6">
                  <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">Tags</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentTags.map(tag => (
                      <button
                        key={tag.tagname}
                        onClick={() => handleTagToggle(tag)}
                        className="bg-emerald-500/10 hover:bg-red-500/10 text-emerald-400 hover:text-red-400 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 group"
                        title="Click to remove"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-red-400 transition-colors" />
                        {tag.tagname}
                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}

                    {/* Tag dropdown */}
                    <div className="relative" ref={tagDropdownRef}>
                      <button
                        onClick={async () => {
                          setShowTagDropdown(v => !v);
                          if (!userTags) {
                            try {
                              const res = await axios.get(
                                `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags/get/o/${profile?._id}`,
                                { withCredentials: true }
                              );
                              if (res.data?.data) {
                                setTags(res.data.data);
                              }
                            } catch (e) {
                              console.error("Lazy tag fetch failed", e);
                            }
                          }
                        }}
                        className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <TagIcon className="w-3 h-3" />
                        <span>Add tag</span>
                      </button>

                      {showTagDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto flex flex-col">
                          {/* Search Input */}
                          <div className="px-2 pb-1 border-b border-zinc-800 mb-1 sticky top-0 bg-zinc-900 z-10">
                            <input
                              type="text"
                              value={tagSearchQuery}
                              onChange={(e) => setTagSearchQuery(e.target.value)}
                              placeholder="Search tags..."
                              className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none px-1 py-1"
                              autoFocus={!isCreatingTag}
                            />
                          </div>

                          {/* Existing user tags */}
                          {filteredUserTags.length > 0 ? filteredUserTags.map(tag => {
                            const isActive = currentTags.some(t => t.tagname === tag.tagname);
                            return (
                              <button
                                key={tag.tagname}
                                onClick={() => handleTagToggle(tag)}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 flex items-center justify-between text-zinc-300 transition-colors"
                              >
                                <span>{tag.tagname}</span>
                                {isActive && <Check className="w-3 h-3 text-emerald-500" />}
                              </button>
                            );
                          }) : (
                            <p className="px-3 py-2 text-xs text-zinc-500">No tags found.</p>
                          )}

                          {/* Divider + Create new tag */}
                          <div className="border-t border-zinc-800 mt-1 pt-1">
                            {isCreatingTag ? (
                              <div className="flex items-center gap-1.5 px-2 py-1.5">
                                <input
                                  autoFocus
                                  type="text"
                                  value={newTagName}
                                  onChange={(e) => setNewTagName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateTag();
                                    if (e.key === "Escape") { setIsCreatingTag(false); setNewTagName(""); }
                                  }}
                                  placeholder="Tag name..."
                                  className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                                />
                                <button onClick={handleCreateTag} className="text-emerald-500 hover:text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setIsCreatingTag(false); setNewTagName(""); }} className="text-zinc-600 hover:text-zinc-400">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsCreatingTag(true)}
                                className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Create new tag
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collection — shadcn Select */}
                <div className="mb-6">
                  <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Collection</h3>

                  {isCreatingCollection ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 h-9">
                      <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={newCollectionTitle}
                        onChange={(e) => setNewCollectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateCollection();
                          if (e.key === "Escape") { setIsCreatingCollection(false); setNewCollectionTitle(""); }
                        }}
                        placeholder="Collection title..."
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none h-full"
                      />
                      <button onClick={handleCreateCollection} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setIsCreatingCollection(false); setNewCollectionTitle(""); }} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Select value={currentCollectionId} onValueChange={handleCollectionChange}>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-900 focus:ring-0 focus:border-zinc-600 h-9">
                        <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="flex flex-1 text-left line-clamp-1">
                          {currentCollectionId && currentCollectionId !== "__new__"
                            ? collections.find(c => c._id === currentCollectionId)?.title || "Select a collection"
                            : "Select a collection"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        {collections.map(c => (
                          <SelectItem
                            key={c._id}
                            value={c._id}
                            className="hover:bg-white/5 focus:bg-white/5 text-zinc-300"
                          >
                            {c.title}
                          </SelectItem>
                        ))}
                        <div className="border-t border-zinc-800 mt-1 pt-1">
                          <SelectItem
                            value="__new__"
                            className="text-zinc-400 hover:text-zinc-300 hover:bg-white/5 flex items-center"
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus className="w-3 h-3" />
                              Create new collection...
                            </span>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                  {savingField === "collection" && <span className="text-emerald-500 text-xs mt-1 block">Saving...</span>}
                </div>

                {/* Tasks Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Tasks</h3>
                      {currentTasks.length > 0 && (
                        <span className="bg-white/10 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          {currentTasks.filter(t => !t.completed).length}/{currentTasks.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 -mx-2">
                    {currentTasks.map(task => (
                      <div key={task._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                        <button onClick={() => handleToggleTask(task._id)} className="shrink-0 text-zinc-600 hover:text-emerald-500 transition-colors">
                          {task.completed
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <Circle className="w-4 h-4" />
                          }
                        </button>
                        <span className={`text-sm flex-1 ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                          {task.title}
                        </span>
                        {task.date && (
                          <div className="text-emerald-500/80 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Calendar className="w-3 h-3" />
                            {task.date}
                          </div>
                        )}
                        <button onClick={() => handleDeleteTask(task._id)} className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add Task Input */}
                    {isAddingTask && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask();
                            if (e.key === "Escape") { setIsAddingTask(false); setNewTaskTitle(""); }
                          }}
                          placeholder="Task title..."
                          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                        />
                        <button onClick={handleAddTask} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setIsAddingTask(false); setNewTaskTitle(""); }} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {currentTasks.length === 0 && !isAddingTask && (
                      <p className="text-zinc-600 text-xs px-2">No tasks. Click + Add to get started.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => window.open(link, "_blank")}>
          {isNote ? "View note" : "Open link"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toggleIsChecked(id, isChecked)}>
          Mark as completed
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyLink}>Copy link</ContextMenuItem>
        <ContextMenuItem onClick={deleteLinkHandler} className="text-red-400 focus:text-red-400">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default LinkCard;
