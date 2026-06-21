import { themeType } from "@/lib/types";

const toggleThemeModeAtRootElem = (theme: themeType) => {
  const rootElem = document.getElementById("deep-root");
  rootElem?.classList.remove("dark", "light");
  rootElem?.classList.add(theme);
};

export default toggleThemeModeAtRootElem;
