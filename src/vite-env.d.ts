/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_CUSTOMER_BOT?: string
  readonly VITE_PUBLIC_MARKETING_URL?: string
  readonly VITE_SHOP_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
