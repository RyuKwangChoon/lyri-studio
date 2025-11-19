import DefaultTheme from 'vitepress/theme'
import Footer from './components/Footer.vue'
import Layout from './Layout.vue'
import type { App } from 'vue'
import './custom.css'

export default {
  ...DefaultTheme,
  Layout,   // ← 이거 필수! 커스텀 Layout 적용
  enhanceApp({ app }: { app: App }) {
    app.component('Footer', Footer)
  }
}
