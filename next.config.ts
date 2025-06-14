import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ['@chakra-ui/react'],
    },
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['.'],
    },
    images: {
        domains: ['cataas.com'],
    },
};

export default nextConfig;
