
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Removed 'standalone' output to fix static asset serving and auth issues
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
