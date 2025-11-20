// @ts-nocheck
import { defineConfig } from 'vitepress'
// 🔥 CSS 등록
import './theme/custom.css'

export default defineConfig({
  base: '/',
  // ============================
  // 🌐 사이트 기본 정보
  // ============================
  title: "Lyri × Brian Studio",
  description: "AI ✦ Music ✦ Overlay ✦ Dev – 리리와 함께 만드는 스튜디오",
  // 🔥 dead link 검사 끄기
  ignoreDeadLinks: true,

  // ============================
  // 🎨 테마 설정
  // ============================
  themeConfig: {
    appearance: true,

    // ============================
    // 🧭 네비게이션 바
    // ============================
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/docs/' },
      { text: 'Overlay', link: '/overlay/' },
      { text: 'Academy', link: '/academy/' },
      { text: 'Blog', link: '/blog/' },
      { text: 'Studio', link: '/studio/' },
    ],

    // ============================
    // 📚 사이드바 (폴더 기반 자동 구조)
    // ============================
    sidebar: {
      // -------------------------
      // Docs
      // -------------------------
      '/docs/': [
        {
          text: 'Docs Overview',
          items: [
            { text: 'Intro', link: '/docs/' },
            { text: 'How to Use', link: '/docs/howto/' },
            { text: 'Install', link: '/docs/howto/install.md' },
            { text: 'Config', link: '/docs/howto/config.md' },
          ]
        }
      ],

      // -------------------------
      // Overlay v2 Docs
      // -------------------------
      '/overlay/': [
        {
          text: 'Overlay v2',
          items: [
            { text: 'Overview', link: '/overlay/v2/' },
            { text: 'Architecture', link: '/overlay/v2/architecture.md' },
            { text: 'Components', link: '/overlay/v2/components.md' },
            { text: 'WebSocket', link: '/overlay/v2/websocket.md' },
            { text: 'Audio System', link: '/overlay/v2/audio.md' },
          ]
        }
      ],

      // -------------------------
      // Academy (VitePress 강좌)
      // -------------------------
      '/academy/': [
        {
          text: 'VitePress 강좌',
          items: [
            { text: 'Intro', link: '/academy/vitepress/' },
            { text: 'Basics', link: '/academy/vitepress/basics.md' },
            { text: 'Layout', link: '/academy/vitepress/layout.md' },
            { text: 'Deploy', link: '/academy/vitepress/deploy.md' },
          ]
        }
      ],

      // -------------------------
      // Blog 
      // -------------------------
      '/blog/': [
        {
          text: '2025 Dev Logs',
          items: [
            { text: 'Troubleshooting Guide', link: '/blog/2025/troubleshooting_guide.md' },
            { text: 'Homepage Masterflow v2', link: '/blog/2025/homepage_masterflow_v2.md' },
            { text: 'Homepage Build Log', link: '/blog/2025/homepage-build-log.md' },
            { text: 'Overlay Dev Log', link: '/blog/2025/overlay-dev-log.md' },
          ]
        }
      ],

      // -------------------------
      // Studio (소개 페이지)
      // -------------------------
      '/studio/': [
        {
          text: 'Studio Pages',
          items: [
            { text: 'Intro', link: '/studio/' },
            { text: 'About', link: '/studio/about.md' },
          ]
        }
      ],
    },
  },
})
