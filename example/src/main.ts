import { createApp } from "vue"
import "bootstrap"
import "bootstrap/dist/css/bootstrap.css"
import "./assets/dark-mode.css"

import App from "./App.vue"

createApp(App).mount("#app")

declare global {
  interface Window {
    setPlanData: () => void
  }
}
