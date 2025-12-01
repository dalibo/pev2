import DOMPurify from 'dompurify'
import type { App, DirectiveBinding } from 'vue'

export default {
  install(app: App) {
    app.directive('safe-html', {
        beforeMount(el: HTMLElement, binding: DirectiveBinding<string>) {
            el.innerHTML = DOMPurify.sanitize(binding.value)
        },
        updated(el: HTMLElement, binding: DirectiveBinding<string>) {
            if (binding.value !== binding.oldValue) {
                el.innerHTML = DOMPurify.sanitize(binding.value)
            }
        }
    })
  }
}
