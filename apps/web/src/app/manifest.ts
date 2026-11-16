import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/en',
    name: 'AcademyOS Staging',
    short_name: 'AcademyOS',
    description: 'Your academy, connected.',
    start_url: '/en',
    scope: '/',
    display: 'standalone',
    background_color: '#f8faff',
    theme_color: '#313d52',
    icons: [
      { src: '/icons/academyos-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/academyos-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/academyos-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/academyos-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
