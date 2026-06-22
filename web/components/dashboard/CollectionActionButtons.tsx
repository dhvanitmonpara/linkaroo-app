"use client";

import { BiSolidPencil } from "react-icons/bi";
import { RiDeleteBinFill } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbCopyCheckFilled } from "react-icons/tb";
import { PiDotsThreeOutlineFill } from "react-icons/pi";
import { useEffect, useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { fetchedTagType } from "@/lib/types";
import useProfileStore from "@/store/profileStore";
import { usePathname, useRouter, useParams } from "next/navigation";
import { FaLock } from "react-icons/fa";
import { FaLockOpen } from "react-icons/fa";
import useLinkStore from "@/store/linkStore";
import useCollectionsStore from "@/store/collectionStore";
import DrawerMenu from "@/components/general/DrawerMenu";
import { DrawerClose } from "@/components/ui/drawer";
import ResponsiveDialog from "@/components/general/ResponsiveDialog";
import HandleTagForm from "@/components/Forms/HandleTagForm";
import { EditListForm } from "@/components/Forms";
import TooltipContainer from "@/components/general/Tooltip";
import AddCollaboratorForm from "@/components/Forms/AddCollaboratorForm";
import { IoIosCopy, IoMdPersonAdd } from "react-icons/io";
import { FaCircleInfo } from "react-icons/fa6";

type Checked = boolean;

export type checkedTagsType = fetchedTagType & {
  isChecked?: Checked;
};

const CollectionActionButtons = () => {
  const { setTags, profile } = useProfileStore();
  const { currentCollectionItem } = useLinkStore();
  const [loading, setLoading] = useState(false);
  const [checkedTags, setCheckedTags] = useState<checkedTagsType[]>([]);

  const params = useParams();
  const collectionId = params?.collectionId as string | undefined;
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      if (collectionId !== undefined) {
        try {
          setLoading(true);

          const [userTagResponse, collectionTagResponse] = await Promise.all([
            axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags/get/o/${profile._id}`,
              { withCredentials: true }
            ),
            axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_API_URL}/tags/get/collections/${collectionId}`,
              { withCredentials: true }
            ),
          ]);

          if (!userTagResponse.data.data || !collectionTagResponse.data.data) {
            toast.error("Failed to fetch tags");
            return;
          }

          setTags(userTagResponse.data.data);

          const intersection: checkedTagsType[] =
            userTagResponse.data.data.map((tag: checkedTagsType) => ({
              ...tag,
              isChecked: collectionTagResponse.data.data.some(
                (userTag: fetchedTagType) => userTag.tagname === tag.tagname
              ),
            }));

          setCheckedTags(intersection);
        } catch (error) {
          if (error instanceof AxiosError) {
            toast.error(error.response?.data.message || error.message);
          } else {
            console.error(error);
            toast.error("Error while fetching collections");
          }
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [collectionId, profile._id, setTags]);

  return (
    <div className="flex justify-center items-center">
      <div className="hidden md:flex justify-center items-center space-x-3 !relative">
        {pathname.includes("/shared") ? (
          <>
            <DesktopButtonWrapper tooltip={"Make a copy of this collection"}>
              <CopyCollectionButton />
            </DesktopButtonWrapper>
            <DesktopButtonWrapper
              tooltip={"Request to join as a collaborator"}
            >
              <JoinAsCollaborator />
            </DesktopButtonWrapper>
          </>
        ) : (
          <>
            <DesktopButtonWrapper tooltip={"Add Collaborators"}>
              <ManageCollaborators collectionId={collectionId} />
            </DesktopButtonWrapper>
            <DesktopButtonWrapper
              tooltip={`Make this collection ${currentCollectionItem?.isPublic ? "private" : "public"}`}
            >
              <ToggleIsPublicButton />
            </DesktopButtonWrapper>
            <DesktopButtonWrapper tooltip={"Edit Collection"}>
              <EditCollectionButton />
            </DesktopButtonWrapper>
            <DesktopButtonWrapper tooltip={"Edit Tags"}>
              <HandleTagForm
                loading={loading}
                checkedTags={checkedTags}
                setCheckedTags={setCheckedTags}
              />
            </DesktopButtonWrapper>
            <DesktopButtonWrapper tooltip={"Delete Collection"}>
              <DeleteCollectionButton />
            </DesktopButtonWrapper>
          </>
        )}
      </div>
      <div>
        <DrawerMenu
          contentClassName="px-4 !pt-0"
          title="Collection options"
          trigger={
            <button className="md:hidden h-12 w-12 bg-[#6d6d6d20] hover:bg-[#6d6d6d50] transition-colors flex justify-center items-center rounded-full text-xl">
              <PiDotsThreeOutlineFill />
            </button>
          }
        >
          <div className="flex flex-col font-helvetica space-y-1 rounded-2xl overflow-hidden">
            {pathname.includes("/shared") ? (
              <>
                <MobileButtonWrapper>
                  <CopyCollectionButton />
                </MobileButtonWrapper>
                <MobileButtonWrapper>
                  <JoinAsCollaborator />
                </MobileButtonWrapper>
              </>
            ) : (
              <>
                <MobileButtonWrapper>
                  <ManageCollaborators collectionId={collectionId} />
                </MobileButtonWrapper>
                <MobileButtonWrapper>
                  <ToggleIsPublicButton />
                </MobileButtonWrapper>
                <MobileButtonWrapper>
                  <EditCollectionButton />
                </MobileButtonWrapper>
                <MobileButtonWrapper>
                  <HandleTagForm
                    loading={loading}
                    checkedTags={checkedTags}
                    setCheckedTags={setCheckedTags}
                  />
                </MobileButtonWrapper>
                <MobileButtonWrapper>
                  <DeleteCollectionButton />
                </MobileButtonWrapper>
              </>
            )}
          </div>
        </DrawerMenu>
      </div>
    </div>
  );
};

export default CollectionActionButtons;

const MobileButtonWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
      }}
      className="flex flex-col p-2 dark:bg-zinc-800 dark:hover:bg-zinc-700/70 bg-zinc-100 hover:bg-zinc-200 w-full"
    >
      {children}
    </button>
  );
};

const DesktopButtonWrapper = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <TooltipContainer tooltip={tooltip}>
      <div className="h-12 w-12 cursor-pointer bg-[#6d6d6d20] hover:bg-[#6d6d6d50] transition-colors flex justify-center items-center rounded-full text-xl">
        {children}
      </div>
    </TooltipContainer>
  );
};

const CopyCollectionButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { currentCollectionItem, setCurrentCollectionItem } = useLinkStore();
  const { profile } = useProfileStore();
  const router = useRouter();

  const copyCollectionHandler = async () => {
    const id = Date.now().toString();
    try {
      setIsLoading(true);
      toast.loading("Copying Collection...", { id });

      if (isLoading) return;
      if (!currentCollectionItem?._id) {
        toast.error("Collection id not found");
        return;
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/v/${currentCollectionItem?._id}`,
        { userId: profile._id }
      );

      if (res.status !== 200 || !res.data.data._id) {
        toast.error("Failed to copy Collection");
        return;
      }

      toast.success("Collection copied successfully");
      router.push(`/dashboard/c/${res.data.data._id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.status === 301) {
          toast("Collection already exists", { icon: <FaCircleInfo /> });
          setCurrentCollectionItem(null);
          router.replace(`/dashboard/c/${error.response?.data.data._id}`);
          return;
        }
        toast.error(error.response?.data.message || error.message);
      } else {
        console.error(error);
        toast.error("Error while fetching collection details");
      }
    } finally {
      setIsLoading(false);
      toast.dismiss(id);
    }
  };

  return (
    <div
      className={`h-full w-full flex justify-center items-center ${isLoading && "cursor-not-allowed opacity-70"}`}
      onClick={copyCollectionHandler}
    >
      <IoIosCopy />
    </div>
  );
};

const JoinAsCollaborator = () => {
  const sendJoinRequestHandler = () => {
    // TODO: define a function to send a join request
  };

  return (
    <div
      className="h-full w-full justify-center items-center flex"
      onClick={sendJoinRequestHandler}
    >
      <IoMdPersonAdd />
    </div>
  );
};

const ManageCollaborators = ({
  collaborators,
  collectionId,
}: {
  collaborators?: string[];
  collectionId: string | undefined;
}) => {
  const [open, setOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getSharableLink = () => {
    try {
      if (!window.location.href.includes("/c") || !collectionId) {
        toast.error("Please select a collection");
        return;
      }
      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_ACCESS_CONTROL_ORIGIN}/shared/${collectionId}`
      );
      if (collaborators && collaborators.length > 0) {
        setOpen(false);
      } else {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 4000);
      }
      toast(
        <div className="flex space-x-2 justify-center items-center">
          <TbCopyCheckFilled />
          <span>A sharable Link copied to clipboard!</span>
        </div>
      );
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      {collaborators && collaborators.length > 0 ? (
        <ResponsiveDialog
          open={open}
          onOpenChange={setOpen}
          description="collaborator has to request access to join the collection"
          title="Manage Collaborations"
          trigger={<div></div>}
        >
          <div className="flex flex-col gap-2">
            <AddCollaboratorForm getSharableLink={getSharableLink} />
          </div>
        </ResponsiveDialog>
      ) : (
        <div
          onClick={getSharableLink}
          className="space-x-2 w-full md:space-x-0 bg-transparent hover:bg-transparent border-none flex items-center rounded-full text-xl"
          aria-label="Tag Options"
        >
          <span className="flex justify-center items-center h-12 w-12">
            {isCopied ? <TbCopyCheckFilled /> : <IoMdPersonAdd />}
          </span>
          <span className="text-lg md:hidden">Add Collaborators</span>
        </div>
      )}
    </>
  );
};

const DeleteCollectionButton = () => {
  const { removeCollectionsItem } = useCollectionsStore();
  const { profile } = useProfileStore();
  const {
    setLinks,
    removeCachedLinkCollection,
    setCurrentCollectionItem,
    currentCollectionItem,
  } = useLinkStore();
  const router = useRouter();

  const handleDeleteCollection = async () => {
    const loadingId = Date.now().toString();
    try {
      toast.loading("Deleting Collection...", { id: loadingId });

      if (!currentCollectionItem?._id) {
        toast.error("Collection id not found");
        return;
      }

      const deleteDBResponse: AxiosResponse = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/o/${currentCollectionItem._id}/${profile._id}`,
        { withCredentials: true }
      );

      if (currentCollectionItem._id !== undefined) {
        removeCollectionsItem(currentCollectionItem._id);
      }

      if (!deleteDBResponse) {
        toast.error("Failed to delete Collection");
        return;
      }

      setLinks([]);
      removeCachedLinkCollection(currentCollectionItem._id);
      toast.success("Collection deleted successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || error.message);
      } else {
        console.error(error);
        toast.error("Error while deleting collection");
      }
    } finally {
      router.push("/dashboard");
      setCurrentCollectionItem(null);
      toast.dismiss(loadingId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden md:flex" render={<div />}>
          <div
            className="h-12 w-12 bg-transparent hover:bg-transparent border-none flex justify-center items-center rounded-full text-xl"
            aria-label="Tag Options"
          >
            <RiDeleteBinFill />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={`w-56 !bg-black !text-zinc-200 border-zinc-800 p-4 space-y-2`}
        >
          <span className="text-sm text-zinc-200">
            Are you sure you want to delete this Collection?
          </span>
          <div className="flex gap-2 w-full justify-center items-center">
            <DropdownMenuItem
              onClick={handleDeleteCollection}
              className="w-full cursor-pointer bg-red-500 hover:!bg-red-500/70 h-10 hover:!text-zinc-50 flex justify-center items-center"
            >
              <span>Yes</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="w-full cursor-pointer bg-zinc-800 hover:!bg-zinc-800/70 hover:!text-zinc-50 h-10 flex justify-center items-center">
              No
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <DrawerMenu
        triggerClassNames="md:hidden w-full"
        trigger={
          <div
            className="space-x-2 md:space-x-0 w-full bg-transparent hover:bg-transparent border-none flex items-center rounded-full text-xl"
            aria-label="Tag Options"
          >
            <span className="h-12 w-12 flex justify-center items-center">
              <RiDeleteBinFill />
            </span>
            <span className="text-lg">Delete collection</span>
          </div>
        }
      >
        <div className="px-4 flex flex-col gap-2">
          <button className="w-full block font-semibold py-2 px-4 rounded-md bg-red-500 hover:bg-red-600">
            Delete
          </button>
          <DrawerClose asChild>
            <button className="w-full block font-semibold py-2 px-4 rounded-md bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              Cancel
            </button>
          </DrawerClose>
        </div>
      </DrawerMenu>
    </>
  );
};

const EditCollectionButton = () => {
  return (
    <ResponsiveDialog
      title="Edit collection"
      className="px-4 mx-auto"
      trigger={
        <div className="flex space-x-2 items-center w-full md:w-fit">
          <span className="flex justify-center items-center w-12 h-12 !text-xl">
            <BiSolidPencil />
          </span>
          <span className="md:hidden">Edit Collection</span>
        </div>
      }
      description="Edit your collection details"
      cancelText="Cancel"
    >
      <EditListForm />
    </ResponsiveDialog>
  );
};

const ToggleIsPublicButton = () => {
  const { currentCollectionItem, setCurrentCollectionItem } = useLinkStore();
  const { toggleIsPublic } = useCollectionsStore();

  const handleToggleIsPublic = async () => {
    let loaderId = "";

    toast.loading((t) => {
      loaderId = t.id;
      return "Updating Collection...";
    });

    if (!currentCollectionItem) {
      toast.error("Collection not found");
      return;
    }
    try {
      const collection = await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/collections/status/${currentCollectionItem?._id}`,
        {},
        { withCredentials: true }
      );

      if (!collection) {
        toast.error("Failed to update Collection");
        return;
      }

      toggleIsPublic(currentCollectionItem);
      setCurrentCollectionItem({
        ...currentCollectionItem,
        isPublic: !currentCollectionItem.isPublic,
      });
      toast.success("Collection updated successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || error.message);
      } else {
        console.error(error);
        toast.error("Error while toggle is public");
      }
    } finally {
      toast.dismiss(loaderId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden md:flex" render={<div />}>
          <div
            className="h-12 w-12 bg-transparent hover:bg-transparent border-none flex justify-center items-center rounded-full text-xl"
            aria-label="Tag Options"
          >
            {currentCollectionItem?.isPublic ? <FaLockOpen /> : <FaLock />}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={`w-56 !bg-black !text-zinc-200 border-zinc-800 p-4 space-y-2`}
        >
          <span className="text-sm text-zinc-200">
            Are you sure to make your Collection{" "}
            {currentCollectionItem?.isPublic ? "private" : "public"}?
          </span>
          <div className="flex gap-2 w-full justify-center items-center">
            <DropdownMenuItem
              onClick={() => {
                handleToggleIsPublic();
              }}
              className="w-full cursor-pointer bg-red-500 hover:!bg-red-500/70 h-10 hover:!text-zinc-50 flex justify-center items-center"
            >
              <span>Yes</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="w-full cursor-pointer bg-zinc-800 hover:!bg-zinc-800/70 hover:!text-zinc-50 h-10 flex justify-center items-center">
              No
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <DrawerMenu
        triggerClassNames="md:hidden w-full"
        trigger={
          <div
            className="space-x-2 md:space-x-0 w-full bg-transparent hover:bg-transparent border-none flex items-center rounded-full text-xl"
            aria-label="Tag Options"
          >
            <span className="h-12 w-12 flex justify-center items-center">
              {currentCollectionItem?.isPublic ? <FaLockOpen /> : <FaLock />}
            </span>
            <span className="text-lg">
              Make this collection{" "}
              {currentCollectionItem?.isPublic ? "private" : "public"}
            </span>
          </div>
        }
      >
        <div className="px-4 flex flex-col gap-2">
          <button className="w-full block font-semibold py-2 px-4 rounded-md bg-red-500 hover:bg-red-600">
            Make it {currentCollectionItem?.isPublic ? "private" : "public"}
          </button>
          <DrawerClose asChild>
            <button className="w-full block font-semibold py-2 px-4 rounded-md bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              Cancel
            </button>
          </DrawerClose>
        </div>
      </DrawerMenu>
    </>
  );
};
