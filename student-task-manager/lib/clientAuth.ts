"use client";

/**
 * Client-side authentication utilities
 * Handles token storage, refresh logic, and authenticated API calls
 */

// Token storage keys - Only Access Token is stored client-side
// Refresh Token is stored in an HTTP-only cookie for maximum security
const ACCESS_TOKEN_KEY = "accessToken";

export const tokenStorage = {
    getAccessToken: (): string | null => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    setAccessToken: (token: string): void => {
        if (typeof window === "undefined") return;
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    clearTokens: (): void => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    setTokens: (accessToken: string): void => {
        tokenStorage.setAccessToken(accessToken);
    },
};

/**
 * Refresh the access token using the refresh token (stored in HTTP-only cookie)
 */
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const response = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // Note: Browser automatically sends the 'refreshToken' cookie
        });

        if (!response.ok) {
            tokenStorage.clearTokens();
            return null;
        }

        const data = await response.json();

        if (data.success && data.data.accessToken) {
            tokenStorage.setAccessToken(data.data.accessToken);
            return data.data.accessToken;
        }

        return null;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
    }
}

/**
 * Fetch with automatic token refresh on 401 errors
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const accessToken = tokenStorage.getAccessToken();

    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            headers.set("Authorization", `Bearer ${newAccessToken}`);
            response = await fetch(url, {
                ...options,
                headers,
            });
        } else {
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    }

    return response;
}

/**
 * Login helper
 */
export async function login(email: string, password: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
}> {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success && data.data.accessToken) {
            tokenStorage.setAccessToken(data.data.accessToken);
            return { success: true, accessToken: data.data.accessToken };
        }

        return { success: false, error: data.message || "Login failed" };
    } catch (error) {
        return { success: false, error: "Network error" };
    }
}

/**
 * Logout helper
 */
export async function logout(logoutAll: boolean = false): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();

    try {
        const body: any = {};
        if (logoutAll) body.all = true;

        await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken && logoutAll ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }
}
