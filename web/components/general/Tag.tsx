"use client";

type TagProps = { text: string; className?: string };

const Tag = ({ text, className = "" }: TagProps) => {
  return (
    <span
      className={`px-4 py-1 dark:bg-[#292929] dark:hover:!bg-[#1c1c1c] bg-[#00000017] hover:bg-[#00000023] cursor-pointer rounded-full ${className}`}
    >
      {text}
    </span>
  );
};

export default Tag;
