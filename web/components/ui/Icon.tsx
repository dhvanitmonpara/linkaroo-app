"use client";

import { iconMap } from "@/lib/constants/Icons";
import { BsFillCollectionFill } from "react-icons/bs";

function Icon({ icon }: { icon: string }) {
  const checkIconAvailability = () => {
    const IconComp = iconMap[icon as keyof typeof iconMap];
    if (!IconComp) {
      return <BsFillCollectionFill />; // Fallback
    }
    return <IconComp />;
  };
  return <>{checkIconAvailability()}</>;
}

export default Icon;
