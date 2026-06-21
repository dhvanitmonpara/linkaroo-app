"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { colorOptions } from "@/lib/types";
import clsx from "clsx";

export default function CustomCheckbox({
  title,
  id,
  defaultChecked,
  onToggle,
  color,
}: {
  title: string;
  id: string;
  defaultChecked: boolean;
  onToggle: (checked: boolean) => void;
  color: colorOptions;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2">
      <Checkbox
        id={id}
        onCheckedChange={onToggle}
        checked={defaultChecked}
        className={clsx("rounded-full peer", {
          [`data-[state=checked]:!${color}`]: color,
        })}
      />
      <Label
        htmlFor={id}
        className="peer-data-[state=checked]:line-through after:bg-muted-foreground text-base peer-data-[state=checked]:text-muted-foreground relative after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:origin-bottom after:-translate-y-1/2 after:scale-x-0 after:transition-transform after:ease-in-out peer-data-[state=checked]:after:origin-bottom peer-data-[state=checked]:after:scale-x-100"
      >
        {title}
      </Label>
    </div>
  );
}
