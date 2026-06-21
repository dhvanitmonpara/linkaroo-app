"use client";

import useCollectionsStore from "@/store/collectionStore";
import axios, { AxiosError, AxiosResponse } from "axios";
import { FormEventHandler, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { FaPlus, FaTag } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { removeUsernameTag } from "@/utils/toggleUsernameInTag";
import DrawerMenu from "@/components/general/DrawerMenu";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useProfileStore from "@/store/profileStore";
import { useUser } from "@clerk/nextjs";
import { checkedTagsType } from "@/components/dashboard/CollectionActionButtons";

function HandleTagForm({
  setCheckedTags,
  loading,
  checkedTags,
}: {
  loading: boolean;
  setCheckedTags: React.Dispatch<React.SetStateAction<checkedTagsType[]>>;
  checkedTags: checkedTagsType[];
}) {
  const { updateCollectionsTags } = useCollectionsStore();
  const { profile } = useProfileStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState(false);
  const [newTagSubmitLoading, setNewTagSubmitLoading] = useState(false);
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);

  const { user } = useUser();
  const params = useParams();
  const collectionId = params?.collectionId as string | undefined;

  const HandleAddNewTag: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newTagName = formData.get("title")?.toString();

    if (!newTagName) {
      toast.error("Tag name cannot be empty");
      return;
    }

    try {
      setNewTagSubmitLoading(true);

      const createTagResponse: AxiosResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags`,
        {
          tag: newTagName,
          username: user?.username,
          userId: profile?._id,
        },
        { withCredentials: true }
      );

      if (!createTagResponse.data.success) {
        toast.error("Failed to create new tag");
        return;
      }

      const newTag = createTagResponse.data.data;
      setCheckedTags((prevTags) => [
        ...prevTags,
        { ...newTag, isChecked: true },
      ]);

      setNewTagInput(false);
      toast.success("Tag created successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("Error while adding a new tag");
      }
    } finally {
      setNewTagSubmitLoading(false);
    }
  };

  const handleCheckboxChange = (tag: checkedTagsType, checked: boolean) => {
    setCheckedTags((state) =>
      state.map((t) => {
        if (t.tagname === tag.tagname) {
          return { ...t, isChecked: checked };
        }
        return t;
      })
    );
  };

  const handleSaveChanges = async () => {
    try {
      setSaveChangesLoading(true);

      const tagIds = checkedTags
        .filter((tag) => tag.isChecked)
        .map((tag) => tag._id);

      const saveResponse: AxiosResponse = await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags/${collectionId}/customize`,
        { tagArray: tagIds },
        { withCredentials: true }
      );

      if (!saveResponse.data.success) {
        toast.error("Failed to save changes");
      }

      const listTags = checkedTags.filter((tag) => tag.isChecked === true);
      const updatedList = { ...saveResponse.data.data, tags: listTags };

      updateCollectionsTags(updatedList);

      setDropdownOpen(false);
      toast.success("Changes saved successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("Error while saving changes");
      }
    } finally {
      setSaveChangesLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={() => {
          setDropdownOpen(!dropdownOpen);
          setNewTagInput(false);
        }}
        modal={false}
      >
        <DropdownMenuTrigger
          aria-label="Tag Options"
          className="hidden md:flex h-12 w-12 bg-transparent hover:bg-transparent border-none justify-center items-center rounded-full"
          asChild
        >
          <span className="text-base">
            <FaTag />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={`w-56 !bg-black !text-white border-zinc-800`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
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
          <DropdownMenuLabel>Tags</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          {loading ? (
            <div className="w-full h-28 flex justify-center items-center">
              <Loader2 className="animate-spin" size={16} />
            </div>
          ) : (
            <>
              {newTagInput ? (
                <form
                  className="flex justify-center items-center space-x-1"
                  onSubmit={HandleAddNewTag}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Enter title"
                    className={`bg-zinc-800 border-none border-spacing-0`}
                    onFocus={(event) => event.stopPropagation()}
                  />
                  {newTagSubmitLoading ? (
                    <div className="flex justify-center items-center h-full w-12">
                      <Loader2 className="animate-spin" size={16} />
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      className={`w-12 px-2 dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
                    >
                      <FaPlus />
                    </Button>
                  )}
                </form>
              ) : (
                <Button
                  onClick={() => setNewTagInput(true)}
                  className={`w-full px-2 dark:text-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-800 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
                >
                  <span className="flex w-full justify-start items-center space-x-[0.65rem]">
                    <FaPlus /> <span className="font-semibold">Create a new tag</span>
                  </span>
                </Button>
              )}
              <DropdownMenuSeparator className={"bg-zinc-800"} />
              <DropdownMenuGroup>
                {checkedTags.map((tag, index) => (
                  <DropdownMenuCheckboxItem
                    key={index}
                    checked={tag.isChecked}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(tag, checked)
                    }
                  >
                    {removeUsernameTag(tag.tagname)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className={"bg-zinc-800"} />
              <Button
                onClick={handleSaveChanges}
                className={`mt-2 w-full dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
                disabled={saveChangesLoading}
              >
                {saveChangesLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Drawer menu */}
      <DrawerMenu
        contentClassName="px-4"
        trigger={
          <div
            className="md:hidden space-x-2 md:space-x-0 w-full bg-transparent hover:bg-transparent border-none flex items-center rounded-full"
            aria-label="Tag Options"
          >
            <span className="h-12 w-12 flex justify-center items-center">
              <FaTag />
            </span>
            <span className="text-lg">Edit tags</span>
          </div>
        }
      >
        {loading ? (
          <div className="w-full h-28 flex justify-center items-center">
            <Loader2 className="animate-spin" size={16} />
          </div>
        ) : (
          <>
            {checkedTags.length > 0 && (
              <>
                <div className="space-y-1 py-2">
                  {checkedTags.map((tag, index) => (
                    <div
                      key={index}
                      className="space-x-3 flex w-full text-start bg-zinc-800/40 hover:bg-zinc-800/60 p-3 rounded-md"
                    >
                      <Checkbox
                        id={tag.tagname}
                        checked={tag.isChecked}
                        onCheckedChange={() =>
                          handleCheckboxChange(tag, !tag.isChecked)
                        }
                      />
                      <Label className="w-full text-base" htmlFor={tag.tagname}>
                        {removeUsernameTag(tag.tagname)}
                      </Label>
                    </div>
                  ))}
                </div>
                <Separator className={`bg-zinc-800 ${newTagInput && "mb-3"}`} />
              </>
            )}
            {newTagInput ? (
              <form
                className="flex justify-center items-center space-x-1"
                onSubmit={HandleAddNewTag}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter title"
                  className={`bg-zinc-800 border-none border-spacing-0`}
                  onFocus={(event) => event.stopPropagation()}
                />
                {newTagSubmitLoading ? (
                  <div className="flex justify-center items-center h-full w-12">
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                ) : (
                  <Button
                    type="submit"
                    className={`w-12 px-2 dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
                  >
                    <FaPlus />
                  </Button>
                )}
              </form>
            ) : (
              <Button
                onClick={() => setNewTagInput(true)}
                className={`mt-2 w-full dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
                disabled={saveChangesLoading}
              >
                Create new tag
              </Button>
            )}
            <Button
              onClick={handleSaveChanges}
              className={`mt-2 w-full dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-zinc-950`}
              disabled={saveChangesLoading}
            >
              {saveChangesLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        )}
      </DrawerMenu>
    </>
  );
}

export default HandleTagForm;
