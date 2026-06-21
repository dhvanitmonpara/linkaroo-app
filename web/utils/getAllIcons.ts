// IconPicker.tsx
import React from "react";

const iconLibraries = {
  // Ai: () => import('react-icons/ai'),
  // Bi: () => import('react-icons/bi'),
  // Bs: () => import('react-icons/bs'),
  // Fa: () => import('react-icons/fa6'),
  // Fi: () => import('react-icons/fi'),
  Go: () => import("react-icons/go"),
  Hi: () => import("react-icons/hi"),
  // Im: () => import('react-icons/im'),
  // Io: () => import('react-icons/io5'),
  // Md: () => import('react-icons/md'),
  // Ri: () => import('react-icons/ri'),
  // Tb: () => import('react-icons/tb'),
  // Wi: () => import('react-icons/wi'),
};

const getAllIcons = async () => {
  const allIcons: { name: string; Icon: React.ComponentType }[] = [];

  for (const [prefix, importer] of Object.entries(iconLibraries)) {
    const library = await importer();
    Object.entries(library)
      .filter(([key]) => key.startsWith(prefix))
      .forEach(([key, Icon]) => {
        allIcons.push({ name: key, Icon });
      });
  }

  return allIcons;
};

export default getAllIcons;
