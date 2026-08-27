import "bootstrap"
import "bootstrap/dist/css/bootstrap.css"

import { createApp } from "vue"

import App from "./App.vue"

createApp(App).mount("#app")

declare global {
  interface Window {
    setPlanData: () => void
  }
}
