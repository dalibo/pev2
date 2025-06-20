import { createApp } from "vue"
import "bootstrap"
import "bootstrap/dist/css/bootstrap.css"
import VueTippy from "vue-tippy"

import App from "./App.vue"

createApp(App).use(VueTippy, { defaultProps: {theme: "light"}}).mount("#app")

declare global {
  interface Window {
    setPlanData: () => void
  }
}
