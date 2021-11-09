import { createEffect } from "solid-js";
import { QrScanner } from "@diningcity/capacitor-qr-scanner";
import styles from "./index.module.css";
import { appState } from "../../state";

export function Operate() {
  const { state, setSecret, setLevel, t } = appState;

  createEffect(() => {
    if (!state.remoteIp) {
      return;
    }
    fetch(`http://${state.remoteIp}:${state.port}/getBrightness`, {
      headers: {
        authorization: `Bearer ${state.secret}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.level !== undefined) {
          setLevel(res.level);
        }
      });
  });

  return (
    <div class={styles.operate}>
      <div class={styles.row}>
        <div class={styles.label}>{t()("brightness")}</div>
        <input
          class={styles.value}
          type="range"
          min={0}
          max={9}
          value={state.level}
          onChange={(evt) => {
            if (!state.remoteIp) {
              return;
            }
            const input = evt.target as HTMLInputElement;
            setLevel(state.level);
            fetch(
              `http://${state.remoteIp}:${state.port}/brightness/${input.value}`,
              {
                method: "POST",
                headers: {
                  authorization: `Bearer ${state.secret}`,
                },
              }
            ).catch((err) => alert(err));
          }}
        />
      </div>
      <div class={styles.row}>
        <div class={styles.label}>{t()("shutdown")}</div>
        <div
          class={styles.value}
          onclick={() => {
            if (!state.remoteIp) {
              return;
            }
            const shutdown = confirm(`${t()("shutdown")}?`);
            if (shutdown) {
              fetch(`http://${state.remoteIp}:${state.port}/shutdown`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${state.secret}`,
                },
              }).catch((err) => alert(err));
            }
          }}
        >
          <button class={styles.btn}>{t()("shutdown")}</button>
        </div>
      </div>
      <div class={styles.row}>
        <div class={styles.label}>{t()("reboot")}</div>
        <div
          onclick={() => {
            if (!state.remoteIp) {
              return;
            }
            const reboot = confirm(`${t()("reboot")}?`);
            if (reboot) {
              fetch(`http://${state.remoteIp}:${state.port}/reboot`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${state.secret}`,
                },
              }).catch((err) => alert(err));
            }
          }}
          class={styles.value}
        >
          <button class={styles.btn}>{t()("reboot")}</button>
        </div>
      </div>
      <div class={styles.row}>
        <div class={styles.label}>{t()("token")}</div>
        <div
          onclick={async () => {
            const { camera } = await QrScanner.requestPermissions();

            if (camera == "granted") {
              const { result } = await QrScanner.scanQrCode();

              if (result) {
                localStorage.setItem("secret", result);
                setSecret(result);
              }
            }
          }}
          class={styles.value}
        >
          <button class={styles.btn}>{t()("scan")}</button>
        </div>
      </div>
      {state.remoteIp && (
        <div class={styles.row}>
          <div class={styles.label}>IP</div>
          <div class={`${styles.value} ${styles.textCenter}`}>
            {state.remoteIp}:{state.port}
          </div>
        </div>
      )}
    </div>
  );
}
