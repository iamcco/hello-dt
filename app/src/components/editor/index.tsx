import { Camera, CameraResultType } from "@capacitor/camera";
import { Dialog } from "@capacitor/dialog";
import { onMount } from "solid-js";
import { qrcanvas } from "qrcanvas";
import Vditor from "vditor";
import "vditor/dist/index.css";
import styles from "./index.module.css";
import "./global.css";
import { appState } from "../../state";

export function Editor(props: { onPrint?: () => void }) {
  const { state, t } = appState;
  let divRef: HTMLDivElement | undefined;
  let editor: Vditor | undefined;

  onMount(() => {
    if (!divRef) {
      return;
    }
    editor = new Vditor(divRef, {
      lang: state.lang,
      mode: "wysiwyg",
      cache: {
        enable: true,
        id: "hello-dt",
      },
      toolbarConfig: {
        pin: true,
      },
      toolbar: [
        "emoji",
        {
          name: "QrCode",
          tip: "QrCode",
          icon: '<svg t="1635779535012" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2545" width="200" height="200"><path d="M85.312 85.312V384H384V85.312H85.312zM0 0h469.248v469.248H0V0z m170.624 170.624h128v128h-128v-128zM0 554.624h469.248v469.248H0V554.624z m85.312 85.312v298.624H384V639.936H85.312z m85.312 85.312h128v128h-128v-128zM554.624 0h469.248v469.248H554.624V0z m85.312 85.312V384h298.624V85.312H639.936z m383.936 682.56H1024v85.376h-298.752V639.936H639.936V1023.872H554.624V554.624h255.936v213.248h128V554.624h85.312v213.248z m-298.624-597.248h128v128h-128v-128z m298.624 853.248h-85.312v-85.312h85.312v85.312z m-213.312 0h-85.312v-85.312h85.312v85.312z" fill="#262626" p-id="2546"></path></svg>',
          click: async () => {
            const res = await Dialog.prompt({
              title: "Insert QrCode",
              message: "Please input content",
              inputText: "",
              okButtonTitle: t()("ok"),
              cancelButtonTitle: t()("cancel"),
            });
            if (res.cancelled || !res.value) {
              return;
            }
            if (!editor) {
              return;
            }
            const canvas = qrcanvas({
              data: res.value,
              correctLevel: "Q",
            }) as HTMLCanvasElement;

            editor.insertValue(
              `![QrCode](${canvas.toDataURL("image/png", 0.9)})`
            );
          },
        },
        {
          name: "Image",
          tip: "Image",
          icon: '<svg t="1635781963805" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4916" width="200" height="200"><path d="M950.857143 73.142857v877.714286H73.142857V73.142857h877.714286m73.142857-73.142857H0v1024h1024V0zM73.142857 950.857143l292.571429-292.571429 146.285714 146.285715 292.571429-292.571429 146.285714 146.285714v292.571429H73.142857z m512-731.428572c-80.788571 0-146.285714 65.497143-146.285714 146.285715s65.497143 146.285714 146.285714 146.285714 146.285714-65.497143 146.285714-146.285714-65.497143-146.285714-146.285714-146.285715z" p-id="4917"></path></svg>',
          click: async () => {
            const image = await Camera.getPhoto({
              quality: 90,
              allowEditing: true,
              resultType: CameraResultType.Uri,
            });

            if (!editor) {
              return;
            }

            const img = await new Promise<HTMLImageElement>(
              (resolve, reject) => {
                const i = new Image();
                i.src = image.webPath!;
                i.onload = () => {
                  resolve(i);
                };
                i.onerror = (err) => {
                  reject(err);
                };
              }
            );
            const canvas = document.createElement("canvas");
            canvas.width = divRef!.clientWidth;
            canvas.height = img.height * (divRef!.clientWidth / img.width);
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height,
              0,
              0,
              img.width,
              img.height
            );

            editor.insertValue(`![Image](${image.webPath})`);
          },
        },
        "check",
        "headings",
        "bold",
        "italic",
        "strike",
        "insert-before",
        "insert-after",
        {
          name: "Print",
          tip: "Print",
          icon: '<svg t="1635782421188" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="24622" width="200" height="200"><path d="M276.57871 1.035764h503.341411c32.15323 1.126387 56.984945 10.44468 72.037572 31.231641 11.980662 16.48621 18.175791 37.273171 19.455776 63.538469l-0.051199 107.160368h61.388094c32.102031 1.126387 56.933745 10.39348 71.986372 31.180441 11.980662 16.48621 18.175791 37.324371 19.455776 63.589669v414.561633c-0.102399 32.050831-2.355173 56.012156-11.212671 72.600765-13.721442 25.599706-39.11635 37.017174-81.407064 40.396335l-60.159308-0.051199v99.787652c0 23.398131-4.198352 43.980294-13.158249 61.439294-12.595055 24.473319-36.607579 36.812377-67.429624 37.529168H242.121506c-30.41245 0-55.397763-11.110272-70.962384-33.89401-12.441457-18.27819-18.943782-39.884341-19.711773-65.074452v-99.787652h-52.2234c-37.733966 0-66.559235-11.26387-81.867858-37.477969-11.417469-19.558175-16.742207-44.594687-17.049404-75.570331V308.488228C-0.8197 275.925403 5.836223 249.25051 22.066437 229.487537c19.609374-23.961324 53.605784-30.41245 100.146048-26.521295l32.409227-0.0512 0.0512-96.357291c-1.126387-32.562826 5.529536-59.186519 21.759749-79.000692C196.042036 3.646934 230.089644-2.804192 276.57871 1.035764z m526.278747 621.100057H220.00336v301.82053c0.358396 11.622266 3.071965 20.479764 7.782311 27.442884 1.689581 2.457572 5.119941 3.993554 14.335835 3.993554h547.884899c6.758322-0.153598 7.372715-0.460795 7.270317-0.307196 3.583959-6.911921 5.631935-16.895806 5.631935-30.054055l-0.0512-302.895717z m-70.552788 232.138131a34.303606 34.303606 0 0 1 0 68.607211h-439.290948a34.303606 34.303606 0 0 1 0-68.607211h439.290948z m0-97.125283a34.303606 34.303606 0 0 1 0 68.607211h-439.290948a34.303606 34.303606 0 0 1 0-68.607211h439.290948zM119.447717 271.471054c-29.132465 0.102399-35.839588 0.102399-41.983517 7.167918-6.143929 7.167918-9.215894 10.137483-8.601502 28.67167v404.577747c0.204798 19.660574 0.819191 29.081266 5.27354 36.249183s9.215894 8.550302 25.087711 8.550302l52.2234-0.051199v-134.500854H144.586628a34.303606 34.303606 0 0 1 0-68.607211h737.476319a34.303606 34.303606 0 0 1 0 68.607211h-10.649478v134.500854l57.343341 0.153598c10.649478-0.87039 16.742207 0.255997 22.271744-5.529536 5.529536-5.836733 4.556748-19.96777 4.607947-39.065151V299.425933c-0.563194-12.18546-1.689581-16.281413-5.478337-20.735762-3.788756-4.505548-6.655923-6.655923-18.585387-7.116718L119.447717 271.471054z m612.856952 388.603531a34.303606 34.303606 0 0 1 0 68.607211h-439.290948a34.303606 34.303606 0 0 1 0-68.607211h439.290948z m91.390949-357.269491a102.910817 102.910817 0 1 1-0.102399 205.821633 102.910817 102.910817 0 0 1 0.102399-205.821633z m0 68.607211a34.303606 34.303606 0 1 0 0 68.607211 34.303606 34.303606 0 0 0 0-68.607211zM229.475251 71.076559c-4.198352 5.119941-6.860721 15.820618-6.246328 34.303605l-0.051199 97.534878 579.628534 0.0512 0.051199-105.470787c-0.614393-12.13426-3.020765-20.326166-6.399926-24.934113-0.255997-0.409595-5.734334-2.457572-17.714996-2.867167l-504.928594-0.153599c-28.518072-2.303974-43.570699 0.563194-44.33869 1.535983z" fill="#555555" p-id="24623"></path></svg>',
          click: () => {
            if (props.onPrint) props.onPrint();
          },
        },
        "undo",
        "redo",
        {
          name: "more",
          toolbar: [
            "list",
            "ordered-list",
            "quote",
            "line",
            "code",
            "inline-code",
            "table",
          ],
        },
      ],
    });
  });

  return <div ref={divRef} class={styles.editor}></div>;
}
