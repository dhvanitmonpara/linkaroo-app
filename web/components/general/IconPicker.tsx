"use client";

import { debounce } from "lodash";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TooltipContainer from "./Tooltip";
import Icon from "@/components/ui/Icon";
import { allIcons, iconMap } from "@/lib/constants/Icons";

interface IconPickerProps {
  activeIcon: string;
  setActiveIcon: (icon: string) => void;
  defaultLoadedIcons?: number;
}

const IconPicker: React.FC<IconPickerProps> = ({
  activeIcon,
  setActiveIcon,
  defaultLoadedIcons = 15,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedIcons, setLoadedIcons] = useState<number>(defaultLoadedIcons);
  const listRef = useRef<HTMLDivElement>(null);

  // Memoize filtered icons to avoid unnecessary recalculations
  const filteredIcons = useMemo(() => {
    return searchQuery
      ? allIcons.filter((icon) =>
          icon.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allIcons;
  }, [searchQuery]);

  const visibleIcons = useMemo(
    () => filteredIcons.slice(0, loadedIcons),
    [filteredIcons, loadedIcons]
  );

  // Debounce search input
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    if (nearBottom && loadedIcons < filteredIcons.length) {
      setLoadedIcons((prev) => prev + 15);
    }
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const IconItem: React.FC<{
    iconName: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ iconName, isActive, onClick }) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return (
      <button
        className={`icon-item rounded-full text-center cursor-pointer p-2 transition duration-150 ease-in-out ${isActive ? "bg-zinc-700/80" : "hover:bg-zinc-800/80 text-zinc-400 hover:!text-white"}`}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <div
          className={`icon flex items-center py-1.5 justify-center text-xl ${isActive && "!text-white"}`}
        >
          <IconComponent />
        </div>
      </button>
    );
  };

  return (
    <Popover>
      <TooltipContainer tooltip="Change icon">
        <PopoverTrigger className="text-5xl transition-colors duration-200 hover:text-white/90">
          <Icon icon={activeIcon} />
        </PopoverTrigger>
      </TooltipContainer>
      <PopoverContent className="!p-0 !border-none !w-auto !rounded-xl">
        <form className="icon-picker w-full max-w-lg p-4 bg-zinc-900 text-white border border-zinc-700 rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Search icons..."
            autoComplete="off"
            onChange={handleSearch}
            className="w-full py-2 px-4 mb-4 border border-zinc-600 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div
            ref={listRef}
            className="icon-list grid grid-cols-4 gap-4 overflow-y-auto overflow-x-hidden no-scrollbar max-h-72 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
            onScroll={handleScroll}
          >
            {visibleIcons.map((iconName, index) => (
              <IconItem
                key={index}
                iconName={iconName}
                isActive={iconName === activeIcon}
                onClick={() => setActiveIcon(iconName)}
              />
            ))}

            {loadedIcons < filteredIcons.length && (
              <div className="w-full flex items-center h-4 justify-center py-2"></div>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
