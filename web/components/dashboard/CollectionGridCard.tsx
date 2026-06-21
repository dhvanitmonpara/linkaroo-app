"use client";

import {
  colorOptions,
  TagType,
  Collaborator,
  fontOptions,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";
import { removeUsernameTag } from "@/utils/toggleUsernameInTag";
import useMethodStore from "@/store/MethodStore";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import ResponsiveDialog from "@/components/general/ResponsiveDialog";
import { CreateLinkForm } from "@/components/Forms";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import Tag from "@/components/general/Tag";

type CollectionCardProps = {
  id: string;
  tagname: TagType[];
  description: string;
  title: string;
  isBlackMode?: boolean;
  createdBy: Collaborator;
  theme: colorOptions;
  font: fontOptions;
  collaborators: Collaborator[];
};

const CollectionGridCard = ({
  id,
  tagname,
  description,
  title,
  isBlackMode = false,
  collaborators,
  theme,
  font,
  createdBy,
}: CollectionCardProps) => {
  const router = useRouter();

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
      className={`group select-none transition-all h-64 w-full p-6 rounded-md flex justify-between flex-col ${isBlackMode ? "" : theme} ${isBlackMode ? "!text-zinc-300 border-zinc-700 !bg-zinc-900 border-[1px]" : "text-black"}`}
    >
      <div className="space-y-3 relative">
        <div>
          <HoverCard>
            <HoverCardTrigger>
              <span
                className={`${isBlackMode ? "text-zinc-300" : "text-slate-800"} font-semibold w-fit text-sm pb-3 hover:underline`}
              >
                @{createdBy?.username}
              </span>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="w-full h-full flex justify-start items-center space-x-4">
                <div>
                  <img
                    className="rounded-full h-12 w-12 object-cover"
                    src={createdBy?.imageUrl}
                    alt="avatar"
                  />
                </div>
                <div>
                  <h3>{createdBy?.fullName}</h3>
                  <p className="text-sm text-gray-400">@{createdBy?.username}</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <ResponsiveDialog
            title="Add link"
            description="Add a new link to current collection"
            trigger={
              <span
                onClick={(e) => e.stopPropagation()}
                className={`group-hover:opacity-100 text-xl transition-all ease-in-out duration-300 absolute right-3 opacity-0 active:scale-95 ${isBlackMode ? "hover:bg-[#b2b2b220]" : "hover:bg-[#00000015]"} cursor-pointer p-3 rounded-full`}
              >
                <IoMdAdd />
              </span>
            }
          >
            <CreateLinkForm collectionTitle={title} />
          </ResponsiveDialog>
          <h1 className={`text-2xl py-1 font-bold hover:underline ${font}`}>
            {title}
          </h1>
        </div>
        <p className={`text-sm font-semibold ${font}`}>{description}</p>
      </div>
      <div className="flex space-x-2 overflow-x-scroll no-scrollbar">
        <AvatarGroup>
          {[createdBy?.imageUrl, ...collaboratorAvatars].map((imageUrl) => (
            <Avatar key={imageUrl}>
              <AvatarImage className="h-7 w-7" src={imageUrl} />
              <AvatarFallback
                className={`${isBlackMode ? "border border-zinc-600" : ""} h-7 w-7`}
              />
            </Avatar>
          ))}
        </AvatarGroup>
        {isBlackMode ? (
          <div className={`w-7 h-7 ${theme} rounded-full`}></div>
        ) : (
          ""
        )}
        {tags.length > 0 &&
          tags.map((tag, index) => <Tag key={index} text={tag} />)}
      </div>
    </div>
  );
};

export default CollectionGridCard;
