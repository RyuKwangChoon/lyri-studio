// @ts-nocheck
import { defineConfig } from 'vitepress'
import './theme/custom.css'

export default defineConfig({
  base: '/',
  title: 'Lyri × Brian Studio',
  description: '음악, 앨범, 영상이 쌓이는 Lyri × Brian Studio의 공식 아카이브',
  ignoreDeadLinks: true,

  themeConfig: {
    appearance: true,

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Albums', link: '/albums/' },
      { text: 'Videos', link: '/videos/' },
      { text: 'Studio', link: '/studio/' },
      { text: 'Channels', link: '/channels/' },
      { text: 'Archive', link: '/archive/' },
      { text: 'Tools', link: '/tools/' },
    ],

    sidebar: {
      '/albums/': [
        {
          text: 'Albums',
          items: [
            { text: 'Overview', link: '/albums/' },
            { text: 'Featured Albums', link: '/albums/featured.md' },
          ]
        }
      ],

      '/videos/': [
        {
          text: 'Videos',
          items: [
            { text: 'Overview', link: '/videos/' },
            { text: 'Featured Videos', link: '/videos/featured.md' },
          ]
        }
      ],

      '/channels/': [
        {
          text: 'Channels',
          items: [
            { text: 'Overview', link: '/channels/' },
          ]
        }
      ],

      '/studio/': [
        {
          text: 'Studio',
          items: [
            { text: 'Intro', link: '/studio/' },
            { text: 'About', link: '/studio/about.md' },
          ]
        }
      ],
      '/archive/': [
        {
          text: 'Archive',
          items: [
            { text: 'Overview', link: '/archive/' },
            { text: 'Overlay v2 Docs', link: '/overlay/v2/' },
            { text: 'Academy', link: '/academy/' },
            { text: 'Dev Logs', link: '/blog/' },
          ]
        }
      ],
      '/overlay/': [
        {
          text: 'Overlay',
          items: [
            { text: 'Overview', link: '/overlay/' },
            { text: 'v2', link: '/overlay/v2/' },
          ]
        },
        {
          text: 'Overlay v2',
          items: [
            { text: 'Intro', link: '/overlay/v2/intro' },
            { text: 'Architecture', link: '/overlay/v2/architecture' },
            { text: 'Components', link: '/overlay/v2/components' },
            { text: 'WebSocket', link: '/overlay/v2/websocket' },
            { text: 'Audio System', link: '/overlay/v2/audio' },
          ]
        }
      ],
      // '/academy/': [
      //   {
      //     text: 'Academy',
      //     items: [
      //       { text: 'Overview', link: '/academy/' },
      //       { text: 'Basics', link: '/academy/basics' },
      //       { text: 'Layout', link: '/academy/layout' },
      //       { text: 'Deploy', link: '/academy/deploy' },
      //     ]
      //   }
      // ],
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
      '/blog/': [
        {
          text: 'Dev Logs',
          items: [
            { text: 'Overview', link: '/blog/' },
            { text: 'Homepage Build Log', link: '/blog/2025/homepage-build-log' },
            { text: 'Overlay Dev Log', link: '/blog/2025/overlay-dev-log' },
            { text: 'Schedule Log', link: '/blog/2025/schedule_log' },
            { text: 'Homepage Masterflow v2', link: '/blog/2025/homepage_masterflow_v2' },
            { text: 'PWA Install Guide', link: '/blog/2025/pwa_install_guide' },
            { text: 'Troubleshooting Guide', link: '/blog/2025/troubleshooting_guide' },
            { text: 'Overlay v2.8 Github Guide', link: '/blog/2025/overlay_2.8_github_guide' },
            { text: 'Overlay v3 Planning', link: '/blog/2025/Overlay_v3_Planning' },
          ]
        }
      ],
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
      // Tools
      // -------------------------
      '/tools/': [
        {
          text: 'Tools',
          items: [
            { text: 'Overview', link: '/tools/' },
          ]
        },
        {
          text: 'Coupang Price Monitor',
          items: [
            { text: 'Overview', link: '/tools/coupang-price-monitor/' },
            { text: 'Planning', link: '/tools/coupang-price-monitor/planning' },
            { text: 'UI Plan', link: '/tools/coupang-price-monitor/ui-plan' },
            { text: 'API', link: '/tools/coupang-price-monitor/api' },
            { text: 'Deployment', link: '/tools/coupang-price-monitor/deployment' },
            { text: 'Operation', link: '/tools/coupang-price-monitor/operation' },
            { text: 'Crawl Diagnostics v0.2', link: '/tools/coupang-price-monitor/crawl-diagnostics_v0.2'},
            { text: 'Crawl Diagnostics v0.3', link: '/tools/coupang-price-monitor/crawl-diagnostics_v0.3'},
          ]
        }
      ],      
    },
  },
})
