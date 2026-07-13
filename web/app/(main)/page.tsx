"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Loader2, ArrowRight } from "lucide-react";
import useProfileStore from "@/store/profileStore";
import useCollectionsStore from "@/store/collectionStore";
import useLinkStore from "@/store/linkStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/dashboard";
import { fetchedLinkType } from "@/lib/types";
import formatLinks from "@/utils/formatLinks";

const MasonryHomePage = () => {
    const { theme, _id, font } = useProfileStore().profile;
    const { inbox, setInbox, setCollections, addInboxLinkItem } = useCollectionsStore();
    const { allLinks, setAllLinks, addAllLinkItem } = useLinkStore();

    const { user } = useUser();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingLinks, setFetchingLinks] = useState(true);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'n' || e.key === 'N') {
                if (
                    document.activeElement?.tagName === "INPUT" ||
                    document.activeElement?.tagName === "TEXTAREA"
                ) {
                    return;
                }
                e.preventDefault();
                document.getElementById('quick-note-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const fetchAllLinks = async () => {
            try {
                setFetchingLinks(true);
                const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/all`, {
                    withCredentials: true,
                });
                const formatted = formatLinks(res.data.data);
                setAllLinks(formatted);
            } catch (error) {
                console.error("Failed to fetch all links:", error);
                toast.error("Failed to load your links");
            } finally {
                setFetchingLinks(false);
            }
        };

        const fetchCollections = async () => {
            if (inbox?._id || !_id) return;
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/u/all/${_id}`,
                    { withCredentials: true }
                );
                if (response.status === 200) {
                    const allCollections = response.data.data || response.data || [];
                    const inboxCollection = (Array.isArray(allCollections) ? allCollections : []).find((c: any) => c.isInbox === true);
                    const regularCollections = (Array.isArray(allCollections) ? allCollections : []).filter((c: any) => c.isInbox === false);
                    setCollections(regularCollections);
                    setInbox(inboxCollection);
                }
            } catch (error) {
                console.error("Failed to fetch collections:", error);
            }
        };

        fetchAllLinks();
        fetchCollections();
    }, [setAllLinks, _id, inbox?._id, setCollections, setInbox]);

    const quickAddHandler = async ({ url }: { url: string; }) => {
        try {
            setLoading(true);
            let targetCollectionId = inbox?._id || (inbox as any)?.ID;

            if (!targetCollectionId) {
                if (!_id || _id === "undefined") {
                    toast.error("User ID not available");
                    setLoading(false);
                    return;
                }

                try {
                    const createInboxRes = await axios.post(
                        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections`,
                        {
                            Title: "Inbox",
                            IsInbox: true,
                            CreatedByID: _id
                        },
                        { withCredentials: true }
                    );

                    if (createInboxRes.status === 201) {
                        const newInbox = createInboxRes.data;
                        targetCollectionId = newInbox._id || newInbox.ID;
                        setInbox(newInbox);
                    } else {
                        toast.error("Failed to create Inbox collection");
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("Error creating inbox:", err);
                    toast.error("Failed to create Inbox collection");
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_API_URL}/links/quick-add/${targetCollectionId}`,
                {
                    link: url,
                    userId: _id
                },
                { withCredentials: true }
            );

            if (response.status !== 201) {
                toast.error("Failed to create card");
                return;
            }

            const userLink = response.data.data.userLink;
            const formattedLink: fetchedLinkType = {
                _id: userLink._id,
                title: userLink.customTitle,
                description: userLink.customDescription,
                link: response.data.data.link.link,
                userId: userLink.userId,
                createdAt: userLink.createdAt,
                updatedAt: userLink.updatedAt,
                collectionId: userLink.collectionId,
                image: response.data.data.link.image,
                isChecked: userLink.isChecked,
                __v: userLink.__v,
                contentType: response.data.data.link.contentType ?? 'link',
            };

            addInboxLinkItem(formattedLink);
            addAllLinkItem(formattedLink);
            toast.success("Link added successfully!");
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Error while creating link");
            }
        } finally {
            setLoading(false);
            setInput("");
        }
    };

    return (
        <div className={`w-full min-h-[calc(100vh-4.5rem)] overflow-y-auto no-scrollbar pb-24`}>
            {/* Header section */}
            <div className="flex flex-col items-center justify-center pt-24 md:pt-48 pb-16 px-6 space-y-6 max-w-2xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
                    What's on your mind, {user?.firstName}?
                </h1>
            </div>

            {/* Masonry Grid */}
            <div className="px-6 md:px-12 lg:px-24 w-full max-w-[1600px] mx-auto">
                {fetchingLinks ? (
                    <div className="w-full flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
                        {/* Sticky Note Input Card */}
                        <div className="break-inside-avoid mb-3">
                            <form
                                onClick={() => document.getElementById('quick-note-input')?.focus()}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (input.trim() !== "") quickAddHandler({ url: input });
                                }}
                                className="cursor-pointer group relative w-full flex flex-col justify-start p-5 sm:p-6 bg-muted/40 hover:bg-muted/50 focus-within:bg-muted/50 backdrop-blur-md border border-border/50 hover:border-border/80 focus-within:border-border/80 shadow-sm hover:shadow-md focus-within:shadow-md rounded-2xl transition-all duration-300 min-h-[160px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <h3 className="relative text-[10px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                                    Quick Capture
                                </h3>
                                <Textarea
                                    id="quick-note-input"
                                    disabled={loading}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            if (input.trim() !== "" && !loading) {
                                                quickAddHandler({ url: input });
                                            }
                                        }
                                    }}
                                    placeholder="Jot down a thought, save a link, or capture an idea..."
                                    className="relative w-full px-0 py-1 text-base sm:text-lg !bg-transparent dark:!bg-transparent border-none outline-none ring-0 focus-visible:ring-0 shadow-none text-foreground placeholder:text-muted-foreground/50 resize-none flex-1 min-h-[80px]"
                                />
                                <div className="relative flex justify-end mt-auto pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading || input.trim() === ""}
                                        size="icon"
                                        className={`rounded-full h-8 w-8 shadow-sm transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${input.trim() !== "" ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </form>
                        </div>
                        {allLinks.map((link) => (
                            <div key={link._id} className="break-inside-avoid mb-2">
                                <LinkCard
                                    id={link._id}
                                    title={link.title || link.link}
                                    description={link.description}
                                    createdAt={link.createdAt}
                                    color="bg-black"
                                    link={link.link}
                                    image={link.image}
                                    type="cards"
                                    isChecked={link.isChecked}
                                    collectionId={link.collectionId}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasonryHomePage;