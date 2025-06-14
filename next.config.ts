import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        optimizePackageImports: ['@chakra-ui/react'],
    },
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['app', 'components', 'features', 'hooks', 'utils'],
    },
};

export default nextConfig;
