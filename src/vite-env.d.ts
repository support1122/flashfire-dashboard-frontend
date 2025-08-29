/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_CLOUD_PRESET: string
  readonly VITE_CLOUDINARY_CLOUD_PRESET_PDF: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_TRACKING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
