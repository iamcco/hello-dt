import { batch, createMemo, createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { locals } from "./local";

type Tabs = "operate" | "print";

export interface AppState {
  secret: string;
  tab: Tabs;
  remoteIp?: string;
  port?: number;
  level: number;
  lang: "zh_CN" | "en_US";
}

function createAppState() {
  const secret = localStorage.getItem("secret");
  const [state, setState] = createStore<AppState>({
    secret: secret || "",
    tab: "operate",
    level: 0,
    lang: navigator.language === "zh-CN" ? "zh_CN" : "en_US",
  });

  const t = createMemo(() => {
    return (key: keyof typeof locals["zh_CN"]) => {
      return locals[state.lang][key];
    };
  });

  return {
    state,
    setState,
    setSecret: (secret: string) => setState("secret", secret),
    setTab: (tab: Tabs) => setState("tab", tab),
    setLevel: (level: number) => setState("level", level),
    setRemote: (remoteIp: string, port: number) => {
      batch(() => {
        setState("remoteIp", remoteIp);
        setState("port", port);
      });
    },
    t,
  };
}

export const appState = createRoot(createAppState);
