"use client";

import useProfileStore from "@/store/profileStore";
import { SettingsForm } from "@/components/Forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReactNode, useState } from "react";
import ProfileForm from "@/components/Forms/ProfileForm";
import FeedbackForm from "@/components/Forms/FeedbackForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth, useUser } from "@clerk/nextjs";
import ConnectorsManager from "@/components/connectors/ConnectorsManager";
import { Plug } from "lucide-react";
import { FiCheck, FiX } from "react-icons/fi";
import { FiUser, FiSettings, FiMessageSquare, FiLogOut } from "react-icons/fi";

const ProfileCard = () => {
  const [open, setIsOpen] = useState(false);

  const { signOut } = useAuth();
  const { profile } = useProfileStore();
  const { user } = useUser();

  return (
    <Popover open={open} onOpenChange={setIsOpen}>
      <PopoverTrigger className="!w-14 dark:text-white flex justify-center items-center rounded-md focus:outline-none">
        <img
          className="rounded-full h-10 w-10 object-cover border-zinc-700 border-2 hover:border-zinc-200 transition-colors"
          src={user?.imageUrl}
          alt="Profile pic"
        />
      </PopoverTrigger>
      <PopoverContent className="!w-64 p-1 mt-1">
        <div className="flex justify-start items-center select-none cursor-pointer px-2 py-1.5 mb-1 bg-transparent hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors">
          <img
            className="rounded-full h-10 w-10 object-cover"
            src={user?.imageUrl}
            alt="Profile pic"
          />
          <div className="ml-3 text-start">
            <h5 className="text-sm dark:text-zinc-200 font-semibold cursor-pointer">
              {user?.fullName}
            </h5>
            <p className="text-xs text-zinc-500 dark:text-gray-400 cursor-pointer">
              {profile.email}
            </p>
          </div>
        </div>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger={
            <div className="flex items-center gap-2">
              <FiUser /> Profile
            </div>
          }
          title="Profile"
          description="Edit your profile"
        >
          <ProfileForm />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger={
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-indigo-400" /> Integrations & Connectors
            </div>
          }
          title="Third-Party Data Connectors"
          description="Mount external services like GitHub, Google Drive, Notion, Slack, and Spotify."
          contentClassName="sm:max-w-3xl max-h-[85vh] overflow-y-auto"
        >
          <ConnectorsManager />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger={
            <div className="flex items-center gap-2">
              <FiSettings /> Settings
            </div>
          }
          title="Settings"
          description="Update account settings"
        >
          <SettingsForm afterSubmit={() => setIsOpen(false)} />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger={
            <div className="flex items-center gap-2">
              <FiMessageSquare /> Feedback
            </div>
          }
          title="Feedback"
          description="Report a bug or Suggest a feature."
        >
          <FeedbackForm setIsOpen={setIsOpen} />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger={
            <div className="flex items-center gap-2">
              <FiLogOut /> Logout
            </div>
          }
          title="Are you sure you want to logout?"
          description="Your account will be deleted if there is no activity found for 60 days."
        >
          <div className="flex justify-end gap-3 mt-2">
            <DialogClose className="px-4 py-2 flex justify-center items-center gap-1.5 rounded-md font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors">
              <FiX className="w-4 h-4" />
              No
            </DialogClose>
            <Button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-md text-zinc-50 font-semibold bg-red-500 hover:bg-red-600 flex items-center gap-1.5"
            >
              <FiCheck className="w-4 h-4" />
              Yes
            </Button>
          </div>
        </DialogContainer>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileCard;

const DialogContainer = ({
  children,
  trigger,
  title,
  description,
  onClose = null,
  contentClassName = "sm:max-w-96",
}: {
  children: ReactNode;
  trigger: ReactNode;
  title: string;
  description: string;
  onClose?: ((value: boolean) => void) | null;
  contentClassName?: string;
}) => {
  return (
    <Dialog onOpenChange={(v) => onClose && onClose(v)}>
      <DialogTrigger className="px-2 py-1.5 text-sm text-start bg-transparent hover:bg-accent hover:text-accent-foreground w-full rounded-sm cursor-pointer outline-none transition-colors">
        {trigger}
      </DialogTrigger>
      <DialogContent aria-hidden className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
