import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Buy or Rent',
    short_name: 'Buy or Rent',
    description: 'Make the biggest financial decision with clearer math.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f0e7',
    theme_color: '#102a2a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
