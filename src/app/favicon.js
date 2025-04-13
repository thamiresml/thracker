// src/app/favicon.js

export const dynamic = 'force-static'

const getFavicon = () => {
  return [
    {
      rel: 'icon',
      url: '/favicon.ico',
      sizes: 'any'
    },
    {
      rel: 'icon',
      url: '/favicon.svg',
      type: 'image/svg+xml'
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-icon.png',
    }
  ]
}

export default function Favicon() {
  return getFavicon()
}