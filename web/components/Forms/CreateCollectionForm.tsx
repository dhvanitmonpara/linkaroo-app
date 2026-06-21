"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { CollectionType, colorOptions } from "@/lib/types";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { backgroundImageUrls, themeOptionsArray } from "@/lib/constants/constants";
import { useRouter } from 'next/navigation';
import useDocStore from "@/store/linkStore";
import useCollectionsStore from "@/store/collectionStore";
import { useUser } from "@clerk/nextjs";
import { CollectionTypeArray, CollectionTypeCustomArray } from "@/lib/constants/collectionArray";
import { Separator } from "../ui/separator";

type HandleCollectionCreationType = {
  title: string;
  description: string;
  theme: colorOptions;
  type: CollectionType;
};

const CreateCollectionForm = ({ afterSubmit }: { afterSubmit?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { addCollectionsItem } = useCollectionsStore();
  const navigate = useRouter()
  const { user } = useUser()
  const { setCurrentCollectionItem } = useDocStore()

  const { control, handleSubmit, register } = useForm<HandleCollectionCreationType>({
    defaultValues: {
      theme: "bg-zinc-200",
      type: "bookmarks",
    },
  });

  const handleCollectionCreation = async (data: HandleCollectionCreationType) => {
    try {
      setLoading(true);

      const randomIndex = Math.floor(
        Math.random() * backgroundImageUrls.length
      );

      if (!user?.primaryEmailAddress?.emailAddress) {
        toast.error("User email not found");
        return
      }

      const newData = { ...data, coverImage: backgroundImageUrls[randomIndex], userEmail: user?.primaryEmailAddress?.emailAddress };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections`,
        newData,
        { withCredentials: true }
      );

      if (response.status !== 200) {
        toast.error("Failed to create collection");
      }

      const collectionId = response.data.data._id;

      if (!collectionId) {
        toast.error("Failed to create collection");
        return;
      }

      const collection = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/u/${collectionId}`,
        { withCredentials: true }
      );

      if (!collection) {
        toast.error("Failed to fetch collection details");
        return;
      }

      addCollectionsItem(collection.data.data);
      setCurrentCollectionItem(collection.data.data);
      navigate.push(`/dashboard/c/${collection.data.data._id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || error.message)
      } else {
        console.error(error);
        toast.error("Error while creating collection")
      }
    } finally {
      setLoading(false);
      afterSubmit && afterSubmit()
    }
  };

  return (
    <div className="dark:text-white flex flex-col w-full sm:max-w-96 justify-center items-center space-y-3">
      <form
        className="h-4/5 flex flex-col space-y-4 w-full justify-center items-center"
        onSubmit={handleSubmit(handleCollectionCreation)}
      >
        <Input
          id="title"
          type="text"
          placeholder="Enter title"
          {...register("title", { required: "Title is required" })}
        />
        <Textarea
          id="description"
          placeholder="Enter description"
          {...register("description")}
        />
        <Controller
          name="theme"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="text-zinc-100 bg-zinc-800 border-zinc-800 sm:max-w-96">
                <SelectValue placeholder="Change theme" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  "dark:bg-zinc-900 dark:text-white dark:border-zinc-800",
                  "[&_[role=option]]:p-0"
                )}
              >
                <SelectGroup>
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {themeOptionsArray.map((themeOption) => (
                      <SelectItem
                        key={themeOption.value}
                        value={themeOption.value}
                        className={cn(
                          themeOption.value,
                          "text-transparent p-4 h-16 text-center flex justify-center items-center rounded border border-none hover:text-black dark:hover:text-black active:text-black focus:outline-none",
                          "data-[state=checked]:font-semibold data-[state=checked]:!text-zinc-900",
                          "[&>span>span]:hidden",
                          `focus:${themeOption.value} focus:brightness-110 transition-colors duration-75`
                        )}
                      >
                        {themeOption.label}
                      </SelectItem>
                    ))}
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="text-zinc-100 bg-zinc-800 border-zinc-800 sm:max-w-96">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  "dark:bg-zinc-900 dark:text-white dark:border-zinc-800",
                  "[&_[role=option]]:p-0"
                )}
              >
                {CollectionTypeArray.map(({ value, label, icon }) => (
                  <SelectItem
                    className="!py-1.5 !px-3 hover:bg-zinc-800"
                    key={value}
                    value={value}
                  >
                    <div
                      className="flex items-center space-x-2 pl-6"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-2" />
                {CollectionTypeCustomArray.map(({ value, label, icon }) => (
                  <SelectItem
                    className="!py-2 !px-3 hover:bg-zinc-800"
                    key={value}
                    value={value}
                  >
                    <div
                      className="flex items-center space-x-2 pl-6"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {loading ? (
          <Button
            disabled
            className="dark:bg-zinc-300 bg-zinc-900 dark:text-zinc-950 text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-400/90 font-semibold w-full cursor-wait"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin dark:text-white" />
            Please wait
          </Button>
        ) : (
          <Button className="dark:bg-zinc-300 bg-zinc-900 dark:text-zinc-950 text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-400/90 font-semibold w-full">
            Create Collection
          </Button>
        )}
      </form>
    </div>
  );
};

export default CreateCollectionForm;
