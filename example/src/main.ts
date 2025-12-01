import { createApp } from "vue"
import "bootstrap"
import "bootstrap/dist/css/bootstrap.css"
import safeHtmlDirective from "./directives/safeHtml"

import App from "./App.vue"

const app = createApp(App)

app.use(safeHtmlDirective)

app.mount("#app")

declare global {
  interface Window {
    setPlanData: () => void
  }
}
