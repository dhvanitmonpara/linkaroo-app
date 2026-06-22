"use client";

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RxCross2 } from "react-icons/rx";
import { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";


type DrawerMenuProps = {
  children: ReactNode;
  trigger: ReactNode;
  className?: string;
  description?: string;
  triggerClassNames?: string;
  contentClassName?: string;
  title?: string;
} & React.ComponentProps<typeof DrawerPrimitive.Root>;

export default function DrawerMenu({
  children,
  trigger,
  description = "",
  triggerClassNames = "",
  contentClassName = "",
  className = "",
  title,
  ...props
}: DrawerMenuProps) {
  return (
    <Drawer {...props}>
      <DrawerTrigger className={triggerClassNames} asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent
        className={`sm:w-[400px] w-11/12 m-auto dark:bg-zinc-900 text-white border-zinc-800 ${className}`}
      >
        {title ? (
          <DrawerHeader className="flex w-full justify-between items-center">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <RxCross2 className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
        ) : (
          <div className="sr-only">
            <DrawerHeader className="flex w-full justify-between items-center">
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
          </div>
        )}
        <div className={`flex-1 overflow-auto py-4 ${contentClassName}`}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
