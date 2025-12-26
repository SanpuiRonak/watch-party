// Blacklist of dangerous hosts/IPs to prevent SSRF attacks
import { secureLogger } from "@/lib/utils/security";

const BLACKLISTED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.169.254", // AWS metadata endpoint
    "::1", // IPv6 localhost
    "[::1]", // IPv6 localhost with brackets
    "metadata.google.internal", // GCP metadata
    "169.254.169.254", // Azure metadata
];

/**
 * Check if an IP address is in a private range
 */
function isPrivateIP(hostname: string): boolean {
    // Check for IPv4 private ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const parts = ipv4Match.slice(1).map(Number);
        // 10.0.0.0/8
        if (parts[0] === 10) return true;
        // 172.16.0.0/12
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.0.0/16
        if (parts[0] === 192 && parts[1] === 168) return true;
        // 127.0.0.0/8 (loopback)
        if (parts[0] === 127) return true;
        // 169.254.0.0/16 (link-local)
        if (parts[0] === 169 && parts[1] === 254) return true;
    }

    // Check for IPv6 private/local ranges
    if (hostname.includes(":")) {
        if (
            hostname.startsWith("fe80:") || // link-local
            hostname.startsWith("fc00:") || // unique local
            hostname.startsWith("fd00:") || // unique local
            hostname === "::1"
        ) {
            // loopback
            return true;
        }
    }

    return false;
}

/**
 * Validate stream URL with SSRF protection
 */
export const validateStreamUrl = async(
    url: string,
): Promise<{ isValid: boolean; finalUrl?: string }> => {
    try {
        // Parse URL to validate protocol and hostname
        const parsedUrl = new URL(url);

        // Only allow HTTP(S) protocols
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            secureLogger.error("Invalid protocol:", parsedUrl.protocol);
            return { isValid: false };
        }

        // Check blacklist
        if (BLACKLISTED_HOSTS.includes(parsedUrl.hostname.toLowerCase())) {
            secureLogger.error("Blacklisted hostname:", parsedUrl.hostname);
            return { isValid: false };
        }

        // Check for private IPs
        if (isPrivateIP(parsedUrl.hostname)) {
            secureLogger.error("Private IP address detected:", parsedUrl.hostname);
            return { isValid: false };
        }

        // Optional: Whitelist specific trusted domains (uncomment to enable)
        // const ALLOWED_DOMAINS = ['trusted-cdn.com', 'video-host.com'];
        // if (!ALLOWED_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain))) {
        //   console.error('Domain not in whitelist:', parsedUrl.hostname);
        //   return { isValid: false };
        // }

        // Create manual timeout controller for better browser support
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow", // Automatically stops after 20 redirects
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get("content-type");
        const finalUrl = response.url; // This will be the final URL after redirects

        // Re-validate final URL after redirects to prevent redirect-based SSRF
        const finalParsedUrl = new URL(finalUrl);
        if (
            BLACKLISTED_HOSTS.includes(finalParsedUrl.hostname.toLowerCase()) ||
            isPrivateIP(finalParsedUrl.hostname)
        ) {
            secureLogger.error(
                "Final URL after redirect is blacklisted or private:",
                finalParsedUrl.hostname,
            );
            return { isValid: false };
        }

        const isValid =
            response.ok &&
            Boolean(
                contentType?.includes("video/") ||
                contentType?.includes("application/x-mpegURL") ||
                contentType?.includes("application/vnd.apple.mpegurl") ||
                contentType?.includes("application/octet-stream") || // For .mkv files
                finalUrl.match(/\.(mp4|mkv|avi|mov|webm|m3u8)$/i), // Check file extension
            );

        return { isValid, finalUrl: isValid ? finalUrl : undefined };
    } catch (error) {
        // This will catch infinite redirects, timeouts, and network errors
        secureLogger.error("Stream validation error:", error);
        return { isValid: false };
    }
};
