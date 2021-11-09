import { render } from "solid-js/web";

import "./native";
import "./index.css";
import App from "./App";

render(() => <App />, document.getElementById("root") as HTMLElement);
