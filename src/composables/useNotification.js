import { ref } from 'vue'

export const notification = ref(null)
// { type: 'info'|'warning'|'error', message: string }

let _timer = null

export function notify(message, type = 'info', duration = 4000) {
  if (_timer) clearTimeout(_timer)
  notification.value = { message, type }
  if (duration > 0) {
    _timer = setTimeout(() => { notification.value = null }, duration)
  }
}

export function dismissNotification() {
  if (_timer) clearTimeout(_timer)
  notification.value = null
}
