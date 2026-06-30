// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  devServer: {
    host: '127.0.0.1',
    port: 3000
  },
  vite: {
    server: {
      watch: {
        usePolling: true
      }
    }
  },

  experimental: {
    appManifest: false
  },

  sourcemap: {
    server: false,
    client: false
  },

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    'nuxt-icon',
    '@nuxtjs/google-fonts',
    '@nuxtjs/robots'
  ],
  site: {
    url: 'http://localhost:3000',
  },



  robots: {
    disallow: ['/dashboard/', '/exam/', '/learn/'],
    allow: ['/']
  },

  googleFonts: {
    families: {
      Figtree: [300, 400, 500, 600, 700, 800, 900],
      Inter: [400, 500, 600, 700],
      'JetBrains Mono': [400, 500, 600]
    },
    display: 'swap'
  },

  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'brand',
        themes: {
          brand: {
            dark: false,
            colors: {
              primary: '#1B1B3A',
              secondary: '#6B6B76',
              accent: '#F4791F',
              background: '#FAFAF9',
              surface: '#FFFFFF',
              error: '#D85A30',
              success: '#27500A',
              warning: '#854F0B',
              info: '#0C447C'
            }
          },
          adminNeutral: {
            dark: false,
            colors: {
              primary: '#007AFF',    /* Apple System Blue */
              secondary: '#86868B',  /* Soft Gray */
              accent: '#5E5CE6',     /* Indigo */
              background: '#F5F5F7', /* Classic Apple Light Gray */
              surface: '#FFFFFF',
              error: '#FF3B30',      /* Apple Red */
              success: '#34C759',    /* Apple Green */
              warning: '#FF9500',    /* Apple Orange */
              info: '#32ADE6'        /* Light Blue */
            }
          }
        }
      },
      defaults: {
        VCard: {
          elevation: 0,
        },
        VBtn: {
          elevation: 0,
          rounded: 'md',
          style: 'text-transform: none;'
        },
        VAppBar: {
          elevation: 0
        },
        VTextField: {
          variant: 'outlined',
          density: 'comfortable',
          color: 'primary',
        },
        VSelect: {
          variant: 'outlined',
          density: 'comfortable',
          color: 'primary',
        },
        VChip: {
          rounded: 'pill',
          variant: 'flat',
          style: 'font-weight: 700; font-size: 11px; letter-spacing: 0.1px;'
        }
      }
    }
  },

  css: [
    '@/assets/styles/base.css',
    '@/assets/styles/main.css',
    '@/assets/css/tokens.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || '/api',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    }
  },

  app: {
    head: {
      titleTemplate: '%s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Advanced eLearning Management System' }
      ],
      script: [
        { src: 'https://checkout.razorpay.com/v1/checkout.js', defer: true }
      ]
    }
  }
})
