import { Component, onCleanup, onMount, Show } from "solid-js";
import html2canvas from "html2canvas";
import { Zeroconf } from "@ionic-native/zeroconf";

import styles from "./App.module.css";
import { imageFilter } from "./utils";
import { Editor } from "./components/editor";
import { Subscription } from "rxjs";
import { Operate } from "./components/operate";
import { appState } from "./state";

const App: Component = () => {
  const { state, setTab, setRemote } = appState;
  let editorRef: HTMLDivElement | undefined;
  let subp: Subscription | undefined;

  onMount(() => {
    Zeroconf.reInit().then(() => {
      subp = Zeroconf.watch("_http._tcp.", "local.").subscribe((result) => {
        const { action, service } = result;
        if (action === "added" || action === "resolved") {
          if (service.name === "DevTerm" && service.ipv4Addresses?.length) {
            setRemote(service.ipv4Addresses[0], service.port);
          }
        }
      });
    });
  });

  onCleanup(() => {
    subp?.unsubscribe();
  });

  return (
    <div class={styles.App}>
      <div ref={editorRef} class={styles.editor}>
        <Show
          when={state.tab === "operate"}
          fallback={() => (
            <Editor
              onPrint={() => {
                if (!editorRef || !state.remoteIp) {
                  return;
                }
                setTimeout(() => {
                  const ctn = document.querySelector(
                    ".vditor-wysiwyg"
                  )! as HTMLDivElement;
                  const box = document.querySelector(
                    ".vditor-reset"
                  )! as HTMLDivElement;
                  ctn.style.height = `${box.scrollHeight}px`;

                  // check list
                  document.querySelectorAll(".vditor-task").forEach((item) => {
                    const input = item.querySelector("input")!;
                    item.classList.add("print");
                    const check = document.createElement("div");
                    check.classList.add("checkbox-check");
                    if (input.checked) {
                      check.innerHTML = "✔️";
                    }
                    const box = document.createElement("div");
                    box.classList.add("checkbox-box");
                    item.appendChild(check);
                    item.appendChild(box);
                  });

                  html2canvas(box)
                    .then((canvas) => {
                      ctn.style.height = "unset";
                      document
                        .querySelectorAll(".vditor-task")
                        .forEach((item) => {
                          item.classList.remove("print");
                          item.querySelectorAll("div").forEach((div) => {
                            item.removeChild(div);
                          });
                        });
                      imageFilter(canvas);
                      canvas.toBlob((blob) => {
                        if (!blob) {
                          return;
                        }
                        const form = new FormData();
                        form.set(
                          "size",
                          `${58}x${Math.ceil(
                            canvas.height / (canvas.width / 58)
                          )}`
                        );
                        form.set("target", blob);
                        fetch(`http://${state.remoteIp}:${state.port}/print`, {
                          method: "POST",
                          body: form,
                          headers: {
                            authorization: `Bearer ${state.secret}`,
                          },
                        }).catch((err) => {
                          alert(`fetch print service: ${err}`);
                        });
                      }, "image/png");
                    })
                    .catch((err) => {
                      alert(`html2canvas error: ${err}`);
                    });
                }, 0);
              }}
            />
          )}
        >
          <Operate />
        </Show>
      </div>
      <div
        onclick={() => setTab(state.tab === "operate" ? "print" : "operate")}
        class={styles.switch}
        classList={{
          [styles.active]: !!state.remoteIp,
        }}
      >
        {state.tab === "operate" ? "O/p" : "P/o"}
      </div>
    </div>
  );
};

export default App;
