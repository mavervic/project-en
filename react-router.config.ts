import type { Config } from '@react-router/dev/config';

export default {
  // Disable server-side rendering for SPA static deployment on GitHub Pages
  ssr: false,
  // GitHub Pages subpath for repository https://github.com/mavervic/project-en
  basename: '/project-en/',
} satisfies Config;
