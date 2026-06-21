"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import useLinkStore from "@/store/linkStore";
import useCollectionsStore from "@/store/collectionStore";
import { debounce } from "lodash";
import { CollectionType } from "@/lib/types";

const searchMovieDatabase = async (title: string, type: "movies" | "tv" | "multi" | "person") => {
  try {
    const processedTitle = encodeURIComponent(title); // Safer way to handle spaces & special chars
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/${type}?query=${processedTitle}&include_adult=true&language=en-US&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TMDM_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data || { results: [] };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error fetching movies:", error.message);
    } else {
      console.error("Error fetching movies:", error);
    }
    return { results: [] };
  }
};

const getAnime = async (title: string) => {
  const query = `
  query ($search: String) {
    Page(perPage: 10) { # Fetch up to 10 results per request
      media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        description
        averageScore
      }
    }
  }
  `;

  const variables = { search: title };

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.message || "API Error");

    return data.data.Page.media;
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
}

type CreateLinkBarProps = {
  collectionTitle?: string;
  afterSubmit?: () => void;
};

type HandleLinkCreationType = {
  title: string;
  description: string;
  link: string;
  collection: string;
};

type SearchResults = {
  title: string;
  link: string;
  image: string | null;
  type: string;
  id: string
  description: string
}

const CreateLinkBar: React.FC<CreateLinkBarProps> = ({
  collectionTitle,
  afterSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("")
  const [tabIndex, setTabIndex] = useState(-1)
  const [searchResults, setSearchResults] = useState<null | SearchResults[]>(null)
  const [searchType, setSearchType] = useState<CollectionType>("todos")
  const [isDescriptionActive, setIsDescriptionActive] = useState(false)

  const navigate = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const { collections, inbox } = useCollectionsStore();
  const { addLinkItem, links, addCachedLinkItem } = useLinkStore();

  const { control, handleSubmit, register } = useForm<HandleLinkCreationType>({
    defaultValues: {
      collection: collectionTitle
        ? collections.find((collection) => collection.title === collectionTitle)?._id
        : inbox?._id,
    },
  });

  const handleLinkCreation = async (data: HandleLinkCreationType) => {
    try {
      setLoading(true);
      console.log("runnnnn")
      const parentList = collections.find((list) => list._id === data.collection);

      if (!data.collection || !parentList) {
        toast.error("Invalid list");
        return;
      }

      const newData = {
        title: data.title,
        description: data.description,
        link: data.link,
      };

      const link = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/cards/${data.collection}`,
        newData,
        { withCredentials: true }
      );

      if (!link.data.data) {
        toast.error("Failed to add link");
      }

      if (data.collection == links[0].collectionId) {
        addLinkItem(link.data.data);
      }

      addCachedLinkItem(data.collection, link.data.data);

    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message)
      } else {
        console.error(error);
        toast.error("Error while searching links");
      }
    } finally {
      setLoading(false);
      navigate.push(`/collections/${data.collection}`);
      afterSubmit && afterSubmit();
    }
  };

  const debouncedSearchQuery = useMemo(
    () => debounce(async () => {
      if (!identifier) return;
      const searchResults: SearchResults[] = [];

      if(!collectionTitle){
        // this is search bar so main use-case should be user can find his own created links first even he wrote some text in description then show it in upper row
        // if you don't get at least 5 links then show public links
        // TODO: query for the links on linkaroo db for public links if you find at least 5 then set searchResult and return the function
      } else {
        // const linksOnDatabase = await axios.get(``)
      }

      if (searchType === "movies") {
        const movies = await searchMovieDatabase(identifier, "movies");
        console.log(movies)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const movieResults = movies.results.map((movie: any) => ({
          title: movie.title,
          link: `https://www.themoviedb.org/movie/${movie.id}`,
          image: movie.poster_path,
          type: "movies",
          id: movie.id.toString(),
          description: movie.overview
        }))
        searchResults.push(...movieResults);
      }
      if (searchType === "anime") {
        const anime = await getAnime(identifier);
        searchResults.push(...anime);
      }

      setSearchResults(searchResults);
    }, 700),
    [collectionTitle, identifier, searchType]
  );

  const handleSearch = useCallback(() => {
    debouncedSearchQuery();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    handleSearch();
    return () => debouncedSearchQuery.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, searchType, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchResults) return
      if (e.key === "Tab") {
        e.preventDefault();
        setTabIndex((prevTabIndex) => {
          const newTabIndex = (prevTabIndex + 1) % searchResults.length;
          return newTabIndex;
        });
      } else if (e.key === "Enter") {
        // TODO: fix the enter to submit form issue
        if (tabIndex !== -1) {
          e.preventDefault();
          setIdentifier(searchResults[tabIndex].title); // Set identifier
        }

        // Submit the form if `Enter` is pressed outside the list
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
          return; // Allow default input behavior
        }

        formRef.current?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }) // Simulate form submission
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchResults, tabIndex]);

  useEffect(() => {
    if (!searchResults) return
    if (tabIndex !== -1) {
      setIdentifier(searchResults[tabIndex].title); // Update identifier when tabIndex changes
    }
  }, [searchResults, tabIndex]); // Dependency ensures the effect runs when tabIndex changes  

  if(loading){
    return (
      <div>Loading...</div>
    )
  }

  return (
    <div className="dark:text-white px-4 flex flex-col w-full justify-center items-center">
      {identifier && <div className="xl:hidden w-full mb-6 space-y-2 rounded-3xl bg-zinc-800/70 p-4">
        {searchResults && searchResults.length > 0 ? (
          searchResults.map(({ title, link }, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                setTabIndex(index); // Manually set the tab index on click
              }}
              className={`flex flex-col w-full py-2 px-4 rounded-lg space-y-1 ${tabIndex === index ? "bg-zinc-700/70" : "bg-zinc-800/70 hover:bg-zinc-700/70"
                }`}
            >
              <h1 className="dark:text-zinc-300 text-lg font-semibold">{title}</h1>
              <p className="text-xs text-zinc-300">{link}</p>
            </button>
          ))
        ) : (
          <div className="flex flex-col py-2 px-4 rounded-lg space-y-1 bg-zinc-800/70">
            <h1>No search result found</h1>
          </div>
        )}
      </div>}
      <form
        ref={formRef}
        className="flex flex-col w-full justify-center items-center bg-zinc-800/70 rounded-3xl"
        onSubmit={handleSubmit(handleLinkCreation)}
      >
        <div className="flex w-full border-zinc-800/80 border-1 pt-1 rounded-3xl">
          <Input
            id="identifier"
            type="text"
            autoFocus
            autoComplete="off"
            onChange={(e) => {
              setIdentifier(e.target.value);
            }}
            value={identifier}
            placeholder="Enter a title or link"
            className="rounded-3xl dark:border-zinc-300 focus-visible:!border-transparent py-4 px-6 text-base"
          />
        </div>
        <div className="flex space-x-2 py-2 w-full px-6">
          <Controller
            name="collection"
            control={control}
            rules={{ required: "Please select a list" }}
            render={({ field: { onChange, value } }) => (
              <Select value={value} onValueChange={(value) => {
                const collection = collections.find((item) => item._id === value);
                if (collection) setSearchType(collection.type); else setSearchType("todos");
                onChange(value)
              }}>
                <SelectTrigger className="text-zinc-300 !bg-zinc-800/70 hover:bg-zinc-700/70 max-w-24 py-0.5 px-2.5 h-fit border-0">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent
                  className="dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
                >
                  <SelectGroup>
                    {inbox && <SelectItem key={inbox._id} value={inbox._id}>
                      Inbox
                    </SelectItem>}
                    {collections.map((list) => (
                      <SelectItem key={list._id} value={list._id}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <button
            onClick={() => setIsDescriptionActive(!isDescriptionActive)}
            className="text-zinc-300 bg-zinc-800/70 hover:bg-zinc-700/70 text-xs py-0.5 px-2.5 rounded-md"
          >
            {isDescriptionActive ? "Remove" : "Add"} Description
          </button>
        </div>
        <div className={`px-6 w-full transition-all duration-300 overflow-hidden ${isDescriptionActive ? "pb-2 pt-1" : "h-0"}`}>
          <Textarea
            id="description"
            placeholder="Enter description"
            {...register("description", {
              required: "Description is required",
            })}
          />
        </div>
      </form>
      {identifier && <div className="hidden xl:block w-full mt-6 space-y-2 rounded-3xl bg-zinc-800/70 p-4">
        {searchResults && searchResults.length > 0 ? (
          searchResults.map(({ title, link }, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                setTabIndex(index); // Manually set the tab index on click
              }}
              className={`flex flex-col items-start w-full py-2 px-4 rounded-lg space-y-1 ${tabIndex === index ? "bg-zinc-700/70" : "bg-zinc-800/70 hover:bg-zinc-700/70"
                }`}
            >
              <h1 className="dark:text-zinc-300 text-lg font-semibold">{title}</h1>
              <p className="text-xs text-zinc-300">{link}</p>
            </button>
          ))
        ) : (
          <div className="flex flex-col py-2 px-4 rounded-lg space-y-1 bg-zinc-800/70">
            <h1>No search result found</h1>
          </div>
        )}
      </div>}
    </div>
  );
};

export default CreateLinkBar;