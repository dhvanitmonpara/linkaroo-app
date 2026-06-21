"use client";

import { AvatarGroup, Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  colorOptions,
  TagType,
  Collaborator,
  fontOptions,
} from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Tag from "@/components/general/Tag";
import { removeUsernameTag } from "@/utils/toggleUsernameInTag";
import useMethodStore from "@/store/MethodStore";
import Icon from "@/components/ui/Icon";
import ResponsiveDialog from "./ResponsiveDialog";
import { CreateLinkForm } from "@/components/Forms";
import { BsThreeDots } from "react-icons/bs";
import { RiMenuAddFill } from "react-icons/ri";
import { useState } from "react";

type CollectionCardProps = {
  id: string;
  tagname: TagType[];
  description: string;
  title: string;
  theme: colorOptions;
  font: fontOptions;
  createdBy: Collaborator;
  icon: string;
  collaborators: Collaborator[];
};

const CollectionListCard = ({
  id,
  tagname,
  description,
  title,
  collaborators,
  theme,
  createdBy,
  font,
  icon,
}: CollectionCardProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const collaboratorAvatars: string[] = [];
  const { setCurrentCardColor } = useMethodStore();

  collaborators?.forEach((collaborator) => {
    collaboratorAvatars.push(collaborator.imageUrl);
  });

  const tags: string[] = [];

  tagname?.forEach((tag) => {
    const tagname = removeUsernameTag(tag.tagname);
    if (tagname != undefined) {
      tags.push(tagname);
    }
  });

  const openList = () => {
    setCurrentCardColor(theme);
    router.push(`/dashboard/c/${id}`);
  };

  return (
    <div
      onClick={openList}
      className={`group relative select-none overflow-hidden transition-all h-32 w-full p-4 rounded-md flex space-x-3 dark:text-zinc-300 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700/60 border-1 text-black`}
    >
      <div
        className={`absolute top-0 left-0 ${!pathname.includes(id) && "opacity-0 group-hover:opacity-100"} ${theme || "bg-zinc-100"} h-full w-1 transition-opacity duration-200`}
      ></div>
      <div className="pt-1">
        <Icon icon={icon} />
      </div>
      <div className="h-full">
        <div className="space-y-2">
          <div>
            <CollectionActionButtons id={id} title={title} />
            <h1 className={`text-xl font-bold hover:underline ${font}`}>
              {title}
            </h1>
          </div>
          {description && (
            <p className={`text-sm text-zinc-300/70 font-semibold ${font}`}>
              {description}
            </p>
          )}
        </div>
        <div className="flex pt-3 space-x-2 overflow-x-scroll no-scrollbar">
          <AvatarGroup>
            {[createdBy.imageUrl, ...collaboratorAvatars].map((imageUrl) => (
              <Avatar key={imageUrl}>
                <AvatarImage className="h-7 w-7" src={imageUrl} />
                <AvatarFallback
                  className={`dark:border border-zinc-600 h-7 w-7`}
                >{` `}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          {tags.length > 0 &&
            tags.map((tag, index) => <Tag key={index} text={tag} />)}
        </div>
      </div>
    </div>
  );
};

export default CollectionListCard;

const CollectionActionButtons = ({
  id,
  title,
}: {
  id: string;
  title: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 group-hover:opacity-100 text-xl transition-all ease-in-out duration-300 opacity-0 active:scale-95 dark:hover:bg-[#b2b2b220] hover:bg-[#00000015] cursor-pointer p-3 rounded-full"
      >
        <BsThreeDots />
      </PopoverTrigger>
      <PopoverContent>
        <ResponsiveDialog
          onOpenChange={(value) => value !== true && setOpen(false)}
          title="Add link"
          description="Add a new link to current collection"
          trigger={
            <div className="flex items-center space-x-2">
              <RiMenuAddFill />
              <span>Add Link</span>
            </div>
          }
        >
          <CreateLinkForm collectionTitle={title} />
        </ResponsiveDialog>
      </PopoverContent>
    </Popover>
  );
};
