module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/book',
        'http://localhost:3000/services',
        'http://localhost:3000/about'
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        // Performance assertions
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // Swiss accessibility requirements
        'color-contrast': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',

        // Mobile performance
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',

        // Security
        'is-on-https': 'error',
        'uses-http2': 'warn',

        // Swiss business requirements
        'meta-description': 'error', // SEO for local search
        'document-title': 'error'
      }
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: process.env.LHCI_SERVER_BASE_URL,
      token: process.env.LHCI_TOKEN
    }
  }
}