"use client";

import { colorOptions, fetchedTagType, TaskType } from "@/lib/types";
import { FiArrowUpRight } from "react-icons/fi";
import { BiListPlus } from "react-icons/bi";
import {
  Globe, Copy, Folder, Calendar, Circle, CheckCircle2,
  ExternalLink, Trash2, X, Plus, Check, Tag as TagIcon, FileText, StickyNote
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';

const MilkdownEditor = dynamic(() => import('./MilkdownEditor'), { ssr: false });

const MarkdownRenderer = ({ content, className }: { content: string; className?: string }) => {
  if (!content) return null;
  return (
    <div className={`prose prose-invert max-w-none text-foreground/90 ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold my-1 text-zinc-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold my-1 text-zinc-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold my-1 text-zinc-200">{children}</h3>,
          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 my-1.5 italic text-zinc-400">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-amber-300 font-mono" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-zinc-900/90 border border-white/10 p-3 rounded-xl overflow-x-auto text-xs text-emerald-300 font-mono my-2">
                <code>{children}</code>
              </pre>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 underline hover:text-sky-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};



const embeddabilityCache = new Map<string, boolean>();

const isKnownNonEmbeddable = (url: string): boolean => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const blockedDomains = [
      "google.com",
      "github.com",
      "twitter.com",
      "x.com",
      "facebook.com",
      "instagram.com",
      "linkedin.com",
      "reddit.com",
      "youtube.com",
      "medium.com",
      "notion.so",
      "figma.com",
      "amazon.com",
      "netflix.com",
      "apple.com",
      "microsoft.com",
      "wikipedia.org",
      "canva.com",
      "spotify.com",
      "dropbox.com",
      "pinterest.com",
      "quora.com",
      "stackexchange.com",
      "stackoverflow.com",
      "vimeo.com",
      "tiktok.com",
      "discord.com",
      "slack.com",
    ];
    return blockedDomains.some((domain) => hostname === domain || hostname.endsWith("." + domain));
  } catch (e) {
    return true;
  }
};

const DocAndWebPreviewer = ({
  link,
  title,
  contentType,
  image,
}: {
  link: string;
  title: string;
  contentType?: string;
  image?: string | null;
}) => {
  const isGoogleDoc = Boolean(
    link && (link.includes("docs.google.com") || link.includes("drive.google.com"))
  );
  const isOfficeDoc = Boolean(
    link &&
    (link.toLowerCase().includes(".doc") ||
      link.toLowerCase().includes(".docx") ||
      link.toLowerCase().includes(".ppt") ||
      link.toLowerCase().includes(".pptx") ||
      link.toLowerCase().includes(".xls") ||
      link.toLowerCase().includes(".xlsx") ||
      link.toLowerCase().includes(".csv") ||
      link.toLowerCase().includes(".txt") ||
      link.toLowerCase().includes(".rtf") ||
      link.toLowerCase().includes(".odt") ||
      link.toLowerCase().includes(".ods") ||
      link.toLowerCase().includes(".odp") ||
      link.toLowerCase().includes(".epub"))
  );
  const isPdf = contentType === "pdf" || Boolean(link && link.toLowerCase().includes(".pdf"));
  const isDoc = isPdf || isGoogleDoc || isOfficeDoc || Boolean(
    contentType && (
      contentType.includes("doc") ||
      contentType.includes("pdf") ||
      contentType.includes("sheet") ||
      contentType.includes("presentation") ||
      contentType.includes("text")
    )
  );

  const [isLiveEmbeddable, setIsLiveEmbeddable] = React.useState<boolean | null>(() => {
    if (!link) return false;
    if (isPdf || isGoogleDoc || isOfficeDoc) return false;
    if (isKnownNonEmbeddable(link)) return false;
    if (embeddabilityCache.has(link)) return embeddabilityCache.get(link)!;
    return null;
  });

  React.useEffect(() => {
    if (!link || isPdf || isGoogleDoc || isOfficeDoc) {
      setIsLiveEmbeddable(false);
      return;
    }
    if (isKnownNonEmbeddable(link)) {
      setIsLiveEmbeddable(false);
      return;
    }
    if (embeddabilityCache.has(link)) {
      setIsLiveEmbeddable(embeddabilityCache.get(link)!);
      return;
    }

    let isMounted = true;
    axios
      .get(`/api/check-embed?url=${encodeURIComponent(link)}`)
      .then((res) => {
        if (!isMounted) return;
        const canEmbed = Boolean(res.data?.embeddable);
        embeddabilityCache.set(link, canEmbed);
        setIsLiveEmbeddable(canEmbed);
      })
      .catch(() => {
        if (!isMounted) return;
        embeddabilityCache.set(link, false);
        setIsLiveEmbeddable(false);
      });

    return () => {
      isMounted = false;
    };
  }, [link, isPdf, isGoogleDoc, isOfficeDoc]);

  const showLiveWebTab = isLiveEmbeddable === true;

  const initialMode = isDoc
    ? (isPdf ? "pdf" : "google")
    : (showLiveWebTab ? "live" : "snapshot");

  const [mode, setMode] = React.useState<"live" | "google" | "snapshot" | "pdf">(initialMode);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const nextMode = isDoc
      ? (isPdf ? "pdf" : "google")
      : (isLiveEmbeddable === true ? "live" : "snapshot");
    setMode(nextMode);
    setIsLoading(true);
  }, [link, isDoc, isPdf, isGoogleDoc, isOfficeDoc, isLiveEmbeddable]);

  const targetUrlForScreenshot = isPdf
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`
    : (isGoogleDoc && link.includes("/edit") ? link.replace(/\/edit.*$/, "/preview") : (isOfficeDoc ? `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true` : link));

  const isChatGPTLink = link ? (link.includes("chatgpt.com") || link.includes("chat.openai.com")) : false;

  const screenshotUrl = link
    ? `https://api.microlink.io/?url=${encodeURIComponent(targetUrlForScreenshot)}&screenshot=true&screenshot.fullPage=true&viewport.width=1920&viewport.height=1080&meta=false&embed=screenshot.url${isChatGPTLink ? "&waitForTimeout=8000" : ""}`
    : image || null;

  const [dynamicTitle, setDynamicTitle] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isChatGPTLink && link && (!title || title === "Checkout this chat" || title === "ChatGPT" || title === "ChatGPT Shared Conversation")) {
      let isMounted = true;
      axios
        .get(`https://api.microlink.io/?url=${encodeURIComponent(link)}&waitForTimeout=6000`)
        .then((res) => {
          if (!isMounted) return;
          const fetchedTitle = res.data?.data?.title;
          if (fetchedTitle && typeof fetchedTitle === "string") {
            let cleaned = fetchedTitle
              .replace(/ - ChatGPT$/, "")
              .replace(/ \| ChatGPT$/, "")
              .replace(/^ChatGPT - /, "")
              .replace(/^ChatGPT \| /, "")
              .trim();
            if (cleaned && !cleaned.toLowerCase().includes("checkout this chat") && cleaned.toLowerCase() !== "chatgpt") {
              setDynamicTitle(cleaned);
            }
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [link, isChatGPTLink, title]);

  const getIframeSrc = () => {
    switch (mode) {
      case "pdf":
        return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(link)}`;
      case "google":
        if (isGoogleDoc) {
          if (link.includes("/edit")) {
            return link.replace(/\/edit.*$/, "/preview");
          }
          return link;
        }
        return `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`;
      case "live":
      default:
        return link;
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden relative group shadow-inner">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 backdrop-blur border-b border-white/10 text-xs text-zinc-400 shrink-0 z-10 gap-2">
        <div className="flex items-center space-x-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-medium text-zinc-200 truncate max-w-[180px] sm:max-w-[280px]">
            {dynamicTitle || title || "Document / Web Preview"}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-white/5">
            {showLiveWebTab && (
              <button
                onClick={() => {
                  setIsLoading(true);
                  setMode("live");
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${mode === "live"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "hover:text-zinc-200"
                  }`}
                title="Direct Live Website Preview"
              >
                Live Web
              </button>
            )}
            {isDoc && (
              <button
                onClick={() => {
                  setIsLoading(true);
                  setMode(isPdf ? "pdf" : "google");
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${mode === "google" || mode === "pdf"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "hover:text-zinc-200"
                  }`}
                title="Cloud Doc Reader Engine"
              >
                {isPdf ? "PDF Engine" : "Doc Engine"}
              </button>
            )}
            <button
              onClick={() => {
                setMode("snapshot");
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${mode === "snapshot"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "hover:text-zinc-200"
                }`}
              title="Snapshot View"
            >
              Snapshot
            </button>
          </div>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Open link in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative w-full flex-1 bg-zinc-900 min-h-[460px] flex items-center justify-center overflow-hidden">
        {mode === "snapshot" ? (
          screenshotUrl ? (
            <div className="w-full h-full overflow-y-auto bg-zinc-950 p-4 flex justify-center items-start">
              <img
                src={screenshotUrl}
                alt={title}
                className="w-full max-w-4xl h-auto object-contain shadow-2xl rounded-lg border border-white/10"
              />
            </div>
          ) : (
            <div className="text-zinc-500 font-medium text-sm">No snapshot available</div>
          )
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-20">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-400 font-medium">Streaming preview...</span>
                </div>
              </div>
            )}
            <iframe
              src={getIframeSrc()}
              title={title}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIsLiveEmbeddable(false);
                if (link) embeddabilityCache.set(link, false);
                setMode(isDoc ? (isPdf ? "pdf" : "google") : "snapshot");
              }}
              className="w-full h-full min-h-[460px] border-0 rounded-b-2xl bg-white"
            />
          </>
        )}
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
  const isGoogleDoc = Boolean(link && (link.includes("docs.google.com") || link.includes("drive.google.com")));
  const isOfficeDoc = Boolean(
    link &&
    (link.toLowerCase().includes(".doc") ||
      link.toLowerCase().includes(".docx") ||
      link.toLowerCase().includes(".ppt") ||
      link.toLowerCase().includes(".pptx") ||
      link.toLowerCase().includes(".xls") ||
      link.toLowerCase().includes(".xlsx") ||
      link.toLowerCase().includes(".csv") ||
      link.toLowerCase().includes(".txt") ||
      link.toLowerCase().includes(".rtf") ||
      link.toLowerCase().includes(".odt") ||
      link.toLowerCase().includes(".ods") ||
      link.toLowerCase().includes(".odp") ||
      link.toLowerCase().includes(".epub"))
  );
  const isDoc = isPDF || isGoogleDoc || isOfficeDoc || Boolean(
    contentType && (
      contentType.includes("doc") ||
      contentType.includes("pdf") ||
      contentType.includes("sheet") ||
      contentType.includes("presentation") ||
      contentType.includes("text")
    )
  );

  const getTargetUrlForScreenshot = (url: string) => {
    if (isPDF) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    if (isGoogleDoc && url.includes("/edit")) {
      return url.replace(/\/edit.*$/, "/preview");
    }
    if (isOfficeDoc) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const getMicrolinkUrl = (url: string) => {
    const targetUrl = getTargetUrlForScreenshot(url);
    return `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&screenshot.fullPage=true&viewport.width=1920&viewport.height=1080&meta=false&embed=screenshot.url`;
  };

  const screenshotUrl = isValidUrl ? getMicrolinkUrl(link!) : null;

  const [currentSrc, setCurrentSrc] = React.useState<string | null>(screenshotUrl || image || null);
  const [attemptedScreenshot, setAttemptedScreenshot] = React.useState<boolean>(Boolean(screenshotUrl));
  const [hasFailed, setHasFailed] = React.useState<boolean>(false);

  React.useEffect(() => {
    const initialScreenshotUrl = isValidUrl ? getMicrolinkUrl(link!) : null;

    setCurrentSrc(initialScreenshotUrl || image || null);
    setAttemptedScreenshot(Boolean(initialScreenshotUrl));
    setHasFailed(false);
  }, [link, image, isValidUrl, isDoc, isPDF]);

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
          {isDoc ? "Document" : "Link"}
        </div>
      );
    }
    if (isDoc) {
      return (
        <div className={containerClassName}>
          <div className="w-full h-[340px] aspect-[1/1.414] bg-gradient-to-br from-red-500/10 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center border-b border-border/50 relative overflow-hidden rounded-t-xl">
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-[11px] font-bold text-red-400 uppercase tracking-wider shadow-sm">
              {isPDF ? "PDF (A4)" : "Document"}
            </div>
            <FileText className="w-14 h-14 text-red-400/80 mb-3" />
            <span className="text-xs text-zinc-300 font-medium max-w-[80%] truncate text-center">
              {title || "Document"}
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

export type NoteColor = 'yellow' | 'emerald' | 'rose' | 'sky' | 'purple';

const noteColorMap: Record<NoteColor, { bg: string; border: string; text: string; tape: string; badge: string; dot: string }> = {
  yellow: {
    bg: "bg-amber-500/10 dark:bg-amber-500/5",
    border: "border-amber-500/20 dark:border-amber-500/20 group-hover:border-amber-500/40",
    text: "text-amber-500 dark:text-amber-400",
    tape: "bg-amber-500/30 dark:bg-amber-400/25 border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
    border: "border-emerald-500/20 dark:border-emerald-500/20 group-hover:border-emerald-500/40",
    text: "text-emerald-500 dark:text-emerald-400",
    tape: "bg-emerald-500/30 dark:bg-emerald-400/25 border-emerald-500/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-500/5",
    border: "border-rose-500/20 dark:border-rose-500/20 group-hover:border-rose-500/40",
    text: "text-rose-500 dark:text-rose-400",
    tape: "bg-rose-500/30 dark:bg-rose-400/25 border-rose-500/40",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
  },
  sky: {
    bg: "bg-sky-500/10 dark:bg-sky-500/5",
    border: "border-sky-500/20 dark:border-sky-500/20 group-hover:border-sky-500/40",
    text: "text-sky-500 dark:text-sky-400",
    tape: "bg-sky-500/30 dark:bg-sky-400/25 border-sky-500/40",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/5",
    border: "border-purple-500/20 dark:border-purple-500/20 group-hover:border-purple-500/40",
    text: "text-purple-500 dark:text-purple-400",
    tape: "bg-purple-500/30 dark:bg-purple-400/25 border-purple-500/40",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dot: "bg-purple-400",
  },
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

  // Color state
  const [currentColor, setCurrentColor] = React.useState<NoteColor>((color as NoteColor) || "yellow");

  // Editable state
  const isUUIDTitle = Boolean(title && title.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/));
  const [editTitle, setEditTitle] = React.useState((title === "Quick Note" || isUUIDTitle) ? "" : (title || ""));
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
    const isUUID = Boolean(title && title.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/));
    setEditTitle((title === "Quick Note" || isUUID) ? "" : (title || ""));
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

  const handleColorChange = async (newColor: NoteColor) => {
    setCurrentColor(newColor);
    await patchLink({ color: newColor });
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

  const isValidUrl = Boolean(
    link &&
    (link.startsWith("http://") ||
      link.startsWith("https://") ||
      link.startsWith("www.") ||
      (link.includes(".") && !link.includes(" ") && !link.match(/^[0-9a-fA-F]{8}-/)))
  );
  const isPDF = contentType === 'pdf' || Boolean(link && link.toLowerCase().includes('.pdf'));
  const isGoogleDoc = Boolean(link && (link.includes("docs.google.com") || link.includes("drive.google.com")));
  const isOfficeDoc = Boolean(
    link &&
    (link.toLowerCase().includes(".doc") ||
      link.toLowerCase().includes(".docx") ||
      link.toLowerCase().includes(".ppt") ||
      link.toLowerCase().includes(".pptx") ||
      link.toLowerCase().includes(".xls") ||
      link.toLowerCase().includes(".xlsx") ||
      link.toLowerCase().includes(".csv") ||
      link.toLowerCase().includes(".txt") ||
      link.toLowerCase().includes(".rtf") ||
      link.toLowerCase().includes(".odt") ||
      link.toLowerCase().includes(".ods") ||
      link.toLowerCase().includes(".odp") ||
      link.toLowerCase().includes(".epub"))
  );
  const isDoc = isPDF || isGoogleDoc || isOfficeDoc || Boolean(
    contentType && (
      contentType.includes("doc") ||
      contentType.includes("pdf") ||
      contentType.includes("sheet") ||
      contentType.includes("presentation") ||
      contentType.includes("text")
    )
  );
  const isYouTube = contentType === 'youtube' || Boolean(link && (link.includes('youtube.com') || link.includes('youtu.be')));
  const isExplicitNote = contentType === 'note';
  const isExplicitLink = Boolean(contentType && contentType !== 'note');

  const isNote = isExplicitNote
    ? true
    : isExplicitLink || isValidUrl || image || isYouTube || isPDF
      ? false
      : true;
  const isTitleUUID = Boolean(title && title.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/));
  const hasTitle = Boolean(title && title.trim() !== "" && title !== "Quick Note" && title !== "Unknown Title" && !isTitleUUID && title.trim() !== (description || "").trim());
  const activeNoteTheme = noteColorMap[currentColor] || noteColorMap.yellow;

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
                  title={isNote ? (hasTitle ? `${title}: ${description || ''}` : (description || (link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : ""))) : title}
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
                  <div className={`w-full p-6 flex flex-col justify-between items-start min-h-[160px] relative overflow-hidden ${activeNoteTheme.bg} border ${activeNoteTheme.border} rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md`}>
                    {/* Folded Corner Accent */}
                    <div className={`absolute top-0 right-6 w-12 h-3.5 ${activeNoteTheme.tape} backdrop-blur-sm rounded-b-sm border-x border-b rotate-2 shadow-xs`} />

                    <div className="w-full space-y-2 relative z-10">
                      <div className={`flex items-center space-x-1.5 ${activeNoteTheme.text} text-[11px] font-bold uppercase tracking-wider`}>
                        <StickyNote className="w-3.5 h-3.5" />
                        <span>Note</span>
                      </div>
                      {hasTitle && (
                        <h4 className="text-base font-semibold text-foreground tracking-tight line-clamp-2 w-full text-left">
                          {title}
                        </h4>
                      )}
                      <div className="line-clamp-6 w-full text-left overflow-hidden">
                        <MarkdownRenderer
                          content={description || (link && !link.match(/^[0-9a-fA-F]{8}-/) ? link : "")}
                          className={hasTitle ? "text-sm text-muted-foreground" : "text-base font-medium"}
                        />
                      </div>
                    </div>

                    <div className="w-full flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                      <Checkbox
                        onClick={(e) => { e.stopPropagation(); toggleIsChecked(id, isChecked); }}
                        className="border-white/20 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
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
                        className={contentType === 'github-profile' ? 'w-24 h-24 object-cover rounded-full shadow-sm ring-4 ring-background' : (isPDF || isDoc) ? 'w-full h-[340px] object-cover object-top rounded-t-xl bg-zinc-950/80' : 'w-full object-cover max-h-48 aspect-video'}
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

          {isNote ? (
            <DialogContent
              showCloseButton={false}
              className={`w-[92vw] sm:w-[85vw] md:w-[80vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-2xl md:rounded-3xl border ${activeNoteTheme.border} text-zinc-200 shadow-2xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-2xl`}
            >
              {/* Sticky Note Styling Elements on the Dialog Container */}
              <div className={`absolute inset-0 -z-10 bg-zinc-950/95 ${activeNoteTheme.bg}`} />
              {/* Sticky Note Shutter Tape Theme Selector */}
              <div
                className={`group absolute top-0 right-12 sm:right-44 w-28 h-5 hover:h-[310px] -mt-0.5 z-50 ${activeNoteTheme.tape} backdrop-blur-xl rounded-b-md hover:rounded-b-xl border-x border-b border-white/15 shadow-sm hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between overflow-hidden rotate-1`}
                title="Change theme accent color"
              >
                {/* Full-width Solid Boxy Color Stack (Extra tall blocks, unrolls via translate-y) */}
                <div className="w-full flex flex-col shrink-0 -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  {(['yellow', 'emerald', 'rose', 'sky', 'purple'] as NoteColor[]).map((c) => {
                    const isSelected = currentColor === c;
                    const tickColor = c === 'purple' ? 'text-white' : 'text-zinc-950';

                    return (
                      <button
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange(c);
                        }}
                        className={`group/btn w-full h-[58px] ${noteColorMap[c].dot} flex items-center justify-center transition-all duration-150 hover:brightness-105`}
                      >
                        <Check
                          className={`w-4.5 h-4.5 ${tickColor} stroke-[3] transition-all duration-150 ${isSelected
                            ? 'opacity-100 scale-110'
                            : 'opacity-0 group-hover/btn:opacity-40 hover:!opacity-80'
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Shutter Pull Tab / Bottom Handle (Flush below colors) */}
                <div className="w-full h-5 shrink-0 flex items-center justify-center">
                  <div className="w-7 h-1 rounded-full bg-white/40 group-hover:bg-white/70 transition-colors shadow-xs" />
                </div>
              </div>

              {/* Minimal Top Control Bar */}
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3.5">
                <div className="flex items-center space-x-3">
                  {createdAt && (
                    <span className="text-xs text-zinc-500 font-medium">
                      {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Markdown Canvas</span>
                  </span>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCopyLink}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-white/5 rounded-lg text-xs"
                    title="Copy note"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={deleteLinkHandler}
                    disabled={isDeleting}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg text-xs"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <DialogClose className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-white/5 rounded-lg text-xs">
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </div>
              </div>

              {/* Main Writing Canvas */}
              <div className="flex-1 flex flex-col space-y-4 py-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Note title (optional)"
                  className="w-full bg-transparent border-b border-white/5 pb-2 focus:border-white/20 outline-none text-xl md:text-2xl font-semibold text-zinc-100 placeholder:text-zinc-600 transition-colors"
                />

                <MilkdownEditor
                  value={editDescription}
                  onChange={(val) => setEditDescription(val)}
                  onBlur={handleDescriptionBlur}
                  placeholder="Write your note here using Markdown..."
                />
              </div>

              {/* Sleek Minimal Footer Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4 text-xs">
                {/* Inline Collection & Tags */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Collection Select */}
                  <div className="flex items-center gap-1.5">
                    {isCreatingCollection ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 h-8">
                        <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={newCollectionTitle}
                          onChange={(e) => setNewCollectionTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateCollection();
                            if (e.key === "Escape") { setIsCreatingCollection(false); setNewCollectionTitle(""); }
                          }}
                          placeholder="Collection..."
                          className="bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none w-28"
                        />
                        <button onClick={handleCreateCollection} className="text-emerald-400 hover:text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setIsCreatingCollection(false); setNewCollectionTitle(""); }} className="text-zinc-500 hover:text-zinc-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Select value={currentCollectionId} onValueChange={handleCollectionChange}>
                        <SelectTrigger className="bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 h-8 text-xs rounded-lg px-3">
                          <Folder className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {currentCollectionId && currentCollectionId !== "__new__"
                              ? collections.find(c => c._id === currentCollectionId)?.title || "Collection"
                              : "Collection"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                          {collections.map(c => (
                            <SelectItem key={c._id} value={c._id} className="text-xs hover:bg-white/5">
                              {c.title}
                            </SelectItem>
                          ))}
                          <div className="border-t border-zinc-800 mt-1 pt-1">
                            <SelectItem value="__new__" className="text-zinc-400 hover:text-zinc-200 text-xs">
                              <span className="flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                New collection...
                              </span>
                            </SelectItem>
                          </div>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="h-3 w-px bg-white/10 hidden sm:block" />

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentTags.map(tag => (
                      <button
                        key={tag.tagname}
                        onClick={() => handleTagToggle(tag)}
                        className="bg-white/5 hover:bg-red-500/10 text-zinc-300 hover:text-red-400 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 group border border-white/5"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeNoteTheme.dot}`} />
                        <span>{tag.tagname}</span>
                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}

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
                              if (res.data?.data) setTags(res.data.data);
                            } catch (e) {
                              console.error("Lazy tag fetch failed", e);
                            }
                          }
                        }}
                        className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/5"
                      >
                        <TagIcon className="w-3 h-3" />
                        <span>Add tag</span>
                      </button>

                      {showTagDropdown && (
                        <div className="absolute bottom-full left-0 mb-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1.5 max-h-56 overflow-y-auto flex flex-col">
                          <div className="px-2 pb-1.5 border-b border-zinc-800 mb-1 sticky top-0 bg-zinc-900 z-10">
                            <input
                              type="text"
                              value={tagSearchQuery}
                              onChange={(e) => setTagSearchQuery(e.target.value)}
                              placeholder="Search tags..."
                              className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none px-1 py-0.5"
                              autoFocus={!isCreatingTag}
                            />
                          </div>

                          {filteredUserTags.length > 0 ? filteredUserTags.map(tag => {
                            const isActive = currentTags.some(t => t.tagname === tag.tagname);
                            return (
                              <button
                                key={tag.tagname}
                                onClick={() => handleTagToggle(tag)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center justify-between text-zinc-300 transition-colors"
                              >
                                <span>{tag.tagname}</span>
                                {isActive && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                              </button>
                            );
                          }) : (
                            <p className="px-3 py-2 text-xs text-zinc-500">No tags found.</p>
                          )}

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

                {/* Minimal Stats */}
                <div className="text-[11px] text-zinc-500 font-mono flex items-center space-x-2">
                  <span>{((editDescription || editTitle) ? (editDescription || editTitle).trim().split(/\s+/).filter(Boolean).length : 0)} words</span>
                  <span>•</span>
                  <span>{(editDescription || editTitle).length} chars</span>
                </div>
              </div>
            </DialogContent>
          ) : (
            <DialogContent
              showCloseButton={false}
              className="w-[94vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] sm:max-w-[1300px] max-w-[1300px] max-h-[90vh] overflow-y-auto overflow-x-hidden sm:rounded-3xl border-white/10 bg-zinc-950 text-zinc-300 shadow-2xl p-6 md:p-8 gap-0"
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

                {/* Left Column — Live Web & Document Previewer */}
                <div className="flex flex-col space-y-3 w-full min-w-0">

                  {/* Document & Website Previewer */}
                  <div className="w-full min-h-[500px] h-[520px] rounded-2xl flex items-start justify-center overflow-hidden shadow-sm shrink-0">
                    {isYouTube && youtubeId ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full object-cover rounded-2xl min-h-[480px]"
                      />
                    ) : link ? (
                      <DocAndWebPreviewer
                        link={link}
                        title={title}
                        contentType={contentType}
                        image={image}
                      />
                    ) : image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="text-zinc-500 font-medium text-xl h-full flex items-center justify-center">
                        Preview
                      </div>
                    )}
                  </div>

                  {/* Visit Link & Meta */}
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
                </div>

                {/* Right Column */}
                <div className="flex flex-col min-w-0">

                  {/* Content Type Badge */}
                  <div className="inline-flex items-center gap-1.5 text-zinc-400 text-sm font-medium w-fit mb-4">
                    {isPDF ? <FileText className="w-4 h-4 text-emerald-400" /> : <Globe className="w-4 h-4" />}
                    {isPDF ? 'PDF Document' : 'Website'}
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
          )}
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
