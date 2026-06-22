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
      <PopoverContent className="dark:bg-black dark:text-white dark:border-zinc-800 !w-64 space-y-1 p-2 mt-1">
        <div className="flex justify-start items-center select-none cursor-pointer px-3 py-3 bg-zinc-800/70 hover:bg-zinc-800 rounded-sm">
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
          trigger="Profile"
          title="Profile"
          description="Edit your profile"
        >
          <ProfileForm />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger="Settings"
          title="Settings"
          description="Are you sure you want to logout?"
        >
          <SettingsForm afterSubmit={() => setIsOpen(false)} />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger="Feedback"
          title="Feedback"
          description="Report a bug or Suggest a feature."
        >
          <FeedbackForm setIsOpen={setIsOpen} />
        </DialogContainer>

        <DialogContainer
          onClose={(value) => value !== true && setIsOpen(false)}
          trigger="Logout"
          title="Are you sure you want to logout?"
          description="Your account will be deleted if there is no activity found for 60 days."
        >
          <div className="flex justify-center">
            <Button
              onClick={() => signOut()}
              className="w-full rounded-sm text-zinc-50 font-semibold bg-red-500 hover:bg-red-600"
            >
              Yes
            </Button>
            <DialogClose className="ml-1.5 rounded-sm w-full font-semibold dark:bg-zinc-800 dark:hover:bg-zinc-800/60 bg-zinc-200 hover:bg-zinc-300">
              No
            </DialogClose>
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
}: {
  children: ReactNode;
  trigger: string;
  title: string;
  description: string;
  onClose?: ((value: boolean) => void) | null;
}) => {
  return (
    <Dialog onOpenChange={(v) => onClose && onClose(v)}>
      <DialogTrigger className="p-3 text-sm text-start bg-zinc-800/70 hover:bg-zinc-800 w-full rounded-sm cursor-pointer">
        {trigger}
      </DialogTrigger>
      <DialogContent aria-hidden className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
