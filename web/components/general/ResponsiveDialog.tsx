"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useEffect, useState } from "react";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");

    setIsDesktop(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

function ResponsiveDialog({
  children,
  trigger,
  title,
  description,
  explicitStates = null,
  defaultOpen = false,
  className = "",
  showCloseButton = true,
  prebuildForm = true,
  headerStyling = "",
  onChangeEvent = null,
  triggerStyling = "",
  cancelText = "Cancel",
  ...props
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  explicitStates?: {
    isOpen: boolean;
    setIsOpen: ((value: boolean) => void) | null;
  } | null;
  trigger: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  showCloseButton?: boolean;
  triggerStyling?: string;
  headerStyling?: string;
  onChangeEvent?: ((state: boolean) => void) | null;
  prebuildForm?: boolean;
  cancelText?: string;
} & React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isDesktop = useIsDesktop();

  const isOpen = explicitStates?.isOpen ?? open;
  const setIsOpen = explicitStates?.setIsOpen ?? setOpen;

  const handleOpenChange = (state: boolean) => {
    setIsOpen(state);
  };

  const dialogTrigger =
    React.isValidElement(trigger)
      ? React.cloneElement(trigger as React.ReactElement<any>, {
        type: "button",
      })
      : (
        <button type="button">
          {trigger}
        </button>
      );

  if (isDesktop) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(state) => {
          typeof onChangeEvent === "function" && onChangeEvent(state);
          handleOpenChange(state);
        }}
        {...props}
      >
        <DialogTrigger render={dialogTrigger} nativeButton={false} />

        <DialogContent
          className={`sm:max-w-[27.2rem] md:max-w-96 ${className}`}
          showCloseButton={showCloseButton && prebuildForm}
        >
          {prebuildForm ? (
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          ) : (
            <div className="sr-only">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
            </div>
          )}

          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DrawerTrigger asChild>
        {React.isValidElement(trigger) ? (
          React.cloneElement(trigger as React.ReactElement<any>, {
            type: "button",
            className: triggerStyling,
          })
        ) : (
          <Button className={triggerStyling} type="button">
            {trigger}
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent
        className={`dark:bg-zinc-900/90 mx-auto border-none sm:max-w-96 ${className}`}
      >
        {prebuildForm && (
          <DrawerHeader className={`text-left px-0 pt-6 ${headerStyling}`}>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
        )}

        {children}

        {showCloseButton && (
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="ghost">
                {cancelText}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveDialog;