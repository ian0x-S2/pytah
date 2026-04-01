export const setDomHiddenUntilFound = (dom: HTMLElement) => {
  dom.setAttribute("hidden", "until-found");
};

export const domOnBeforeMatch = (dom: HTMLElement, callback: () => void) => {
  const beforeMatchDom = dom as HTMLElement & {
    onbeforematch: null | (() => void);
  };
  beforeMatchDom.onbeforematch = callback;
};
