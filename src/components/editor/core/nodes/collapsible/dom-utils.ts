export const setDomHiddenUntilFound = (dom: HTMLElement) => {
  dom.setAttribute("hidden", "until-found");
};

export const domOnBeforeMatch = (dom: HTMLElement, callback: () => void) => {
  dom.addEventListener("beforematch", callback);
};
