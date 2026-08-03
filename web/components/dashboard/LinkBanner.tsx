"use client";

import useLinkStore from "@/store/linkStore";
import { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { BsXLg } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { backgroundImageUrls } from "@/lib/constants/constants";
import IconPicker from "../general/IconPicker";
import CollectionActionButtons from "@/components/dashboard/CollectionActionButtons";
import convertMongoDBDate from "@/utils/convertMongoDBDate";
import { BiSolidPencil } from "react-icons/bi";
import Tag from "../general/Tag";

function LinkBanner({ tags, loading }: { tags: string[], loading: boolean }) {

  const { currentCollectionItem, setCurrentCollectionItem } = useLinkStore()

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);

  // TODO: create a dropdown along with images and custom image function
  const handleSaveChanges = (
    e?: any
  ) => {
    let toastId = "";
    try {
      setSaveChangesLoading(true)
      toastId = toast.loading("Changing the list banner...");
      console.log(e);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message)
      } else {
        console.error(error);
        toast.error("Error while saving changes");
      }
    } finally {
      toast.dismiss(toastId);
    }
  };

  const coverImageStyle = {
    backgroundImage: `url('${currentCollectionItem?.coverImage}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const handleChangeIcon = (icon: string) => {
    if (!currentCollectionItem) return
    const collection = currentCollectionItem
    collection.icon = icon
    setCurrentCollectionItem(collection)
  }

  if(!currentCollectionItem){
    // TODO: return skeleton
    return
  }

  return (
    <div className="h-110 w-full py-2">
      <div
        className="group h-2/6 w-full relative overflow-hidden rounded-t-md"
        style={coverImageStyle}
      >
        <div className="h-full w-full bg-black bg-opacity-40 text-zinc-200 p-4">
          <div className="flex justify-end items-center">
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={() => {
                setDropdownOpen(!dropdownOpen);
              }}
              modal={false} // Keeps dropdown within the context of the parent
            >
              <DropdownMenuTrigger disabled={saveChangesLoading} className={`h-12 w-12 ${dropdownOpen || saveChangesLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"} bg-[#00000030] hover:bg-[#00000060] disabled:bg-[#00000030] transition-all flex justify-center items-center rounded-full text-xl`}>
                {dropdownOpen ? <BsXLg /> : (saveChangesLoading ? <Loader2 className="animate-spin" /> : <BiSolidPencil />)}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={`w-96 p-2 dark:bg-zinc-900 dark:text-white dark:border-zinc-800`}
                onCloseAutoFocus={(event) => {
                  event.preventDefault()
                }}
                onPointerDownOutside={(event) => {
                  if (
                    event.target instanceof HTMLElement &&
                    !event.target.closest("input")
                  ) {
                    setDropdownOpen(false);
                  }
                }}
              >
                {loading ? (
                  <div className="w-full h-28 flex justify-center items-center">
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                ) : (
                  <DropdownMenuRadioGroup className="grid grid-cols-3 gap-1">
                    {backgroundImageUrls.map((link, index) => (
                      <DropdownMenuRadioItem
                        isShowCheckbox={false}
                        isFullControl
                        value={link}
                        key={index}
                        onSelect={handleSaveChanges}
                        className="flex justify-center items-center data-[checked]:border-4 border-zinc-200 w-full h-24 cursor-default transition-colors duration-200 hover:brightness-110"
                      >
                        <img
                          className="w-full h-24 object-cover" // Fit the image inside the container
                          src={link}
                          alt={`Background ${index}`}
                        />
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="w-full h-4/6 rounded-b-md dark:text-zinc-300 py-4 px-8 dark:bg-zinc-800">
        <div className="min-h-20 flex flex-col justify-start">
          <div className="py-3">
            <IconPicker activeIcon={currentCollectionItem.icon} defaultLoadedIcons={20} setActiveIcon={handleChangeIcon} />
          </div>
          <div className="flex justify-between items-center w-full">
            <h1 className="text-2xl font-semibold">
              {currentCollectionItem?.title}
            </h1>
            <CollectionActionButtons />
          </div>
          <div className="text-xs text-zinc-400/90 space-x-2">
            <span>@{currentCollectionItem?.createdBy?.username}</span>
            <span>
              {currentCollectionItem?.createdAt &&
                convertMongoDBDate(currentCollectionItem?.createdAt)}
            </span>
          </div>
        </div>
        <div className="pb-4 pt-6 space-y-4">
          <p className="text-sm text-zinc-300/70 line-clamp-2 h-10">{currentCollectionItem?.description}</p>
          <div className="flex space-x-1">
            {tags.length > 0 &&
              tags.map((tag, index) => (
                <Tag
                  key={index}
                  text={tag}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkBanner