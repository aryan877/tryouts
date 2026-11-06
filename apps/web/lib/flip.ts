export const FLIP_FLAG = "data-card-flip";
export const flipKey = (agent: string) => `card:${agent}`;

export const flipScript = (agent: string) =>
  `try{if(!sessionStorage.getItem(${JSON.stringify(flipKey(agent))})&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("${FLIP_FLAG}","")}catch(e){}`;
