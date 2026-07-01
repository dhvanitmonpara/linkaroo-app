"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import useProfileStore from "@/store/profileStore";
import useCollectionsStore from "@/store/collectionStore";
import useLinkStore from "@/store/linkStore";
import { Input } from "@/components/ui/input";
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
                    const allCollections = response.data.data;
                    const inboxCollection = allCollections.find((c: any) => c.isInbox === true);
                    const regularCollections = allCollections.filter((c: any) => c.isInbox === false);
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
            const targetCollectionId = inbox?._id;

            if (!targetCollectionId) {
                toast.error("Inbox collection not found.");
                return;
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
        <div className={`w-full min-h-[calc(100vh-4.5rem)] overflow-y-auto no-scrollbar pb-24 ${theme !== "light" ? "text-zinc-100 bg-zinc-950" : "text-zinc-900 bg-zinc-50"} ${font}`}>
            {/* Header section */}
            <div className="flex flex-col items-center justify-center pt-16 pb-12 px-6 space-y-6 max-w-2xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
                    What's on your mind, {user?.firstName}?
                </h1>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim() !== "") quickAddHandler({ url: input });
                    }}
                    className="w-full relative shadow-sm rounded-full transition-shadow duration-300 focus-within:shadow-md"
                >
                    <Input
                        disabled={loading}
                        type="url"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste a link to save it..."
                        className={`w-full px-6 py-7 text-lg rounded-full border-none outline-none ring-0 focus-visible:ring-0 ${theme !== "light"
                                ? "bg-zinc-900 text-zinc-100 placeholder-zinc-500"
                                : "bg-white text-zinc-900 placeholder-zinc-400"
                            }`}
                        style={{ boxShadow: "none" }}
                    />
                    <Button
                        type="submit"
                        disabled={loading || input.trim() === ""}
                        className={`absolute right-2 top-2 bottom-2 h-auto px-6 rounded-full transition-all duration-300 ${input.trim() !== "" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                            } ${theme !== "light"
                                ? "bg-zinc-200 hover:bg-white text-zinc-900"
                                : "bg-zinc-900 hover:bg-zinc-800 text-white"
                            }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                    </Button>
                </form>
            </div>

            {/* Masonry Grid */}
            <div className="px-6 md:px-12 lg:px-24 w-full max-w-[1600px] mx-auto">
                {fetchingLinks ? (
                    <div className="w-full flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                    </div>
                ) : allLinks.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <p className="text-lg">Nothing here yet.</p>
                        <p className="text-sm mt-2">Paste a link above to start building your mind.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                        {allLinks.map((link) => (
                            <div key={link._id} className="break-inside-avoid">
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