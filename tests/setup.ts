import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global test setup
// Add any global test configurations here

// Mock environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret";
process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";

// Mock process.env for testing NODE_ENV changes
const originalEnv = process.env;
const mockEnv = { ...originalEnv };

// Override process.env with our mock
Object.defineProperty(process, "env", {
    value: mockEnv,
    writable: true,
    configurable: true,
});

// Helper to reset environment between tests
declare global {
    function resetTestEnv(): void;
}

global.resetTestEnv = () => {
    Object.keys(mockEnv).forEach((key) => {
        if (key in originalEnv) {
            mockEnv[key] = originalEnv[key];
        } else {
            delete mockEnv[key];
        }
    });
};

// Mock Next.js router for client-side components
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        pathname: "/",
        query: {},
    }),
    useSearchParams: () => ({
        get: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        forEach: vi.fn(),
        entries: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        toString: vi.fn(),
    }),
    usePathname: () => "/",
}));

// Mock window.matchMedia for components that use it
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
