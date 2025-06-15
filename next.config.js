/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;