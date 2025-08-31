/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.sass' {
  const content: string;
  export default content;
}

declare module '*.less' {
  const content: string;
  export default content;
}

declare module '*.styl' {
  const content: string;
  export default content;
}

declare module '*.stylus' {
  const content: string;
  export default content;
}

declare module '*.pcss' {
  const content: string;
  export default content;
}

declare module '*.sss' {
  const content: string;
  export default content;
}