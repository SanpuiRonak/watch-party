import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ['@chakra-ui/react'],
    },
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['.'],
    },
};

export default nextConfig;
