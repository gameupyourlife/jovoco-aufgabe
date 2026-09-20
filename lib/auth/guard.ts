import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { auth, Session } from "../auth";


/**
 * Custom error thrown when user is not authenticated
 */
export class UnauthenticatedError extends Error {
    constructor(message = "User is not authenticated") {
        super(message);
        this.name = "UnauthenticatedError";
    }
}

/**
 * Custom error thrown when user lacks required permissions
 */
export class InsufficientPermissionsError extends Error {
    constructor(message = "User does not have the required permissions") {
        super(message);
        this.name = "InsufficientPermissionsError";
    }
}

export type AuthBehavior = "null" | "redirect" | "forbidden" | "error";

/**
 * Options for authentication checking
 */
export interface AuthOptions {
    /**
     * If true, throws an error when authentication fails instead of returning null
     * @default false
     */
    behavior?: AuthBehavior;

    /**
     * Required permissions for the authenticated user
     * Format: { resource: ["permission1", "permission2"] }
     */
    permissions?: Record<string, string[]>;
}


/**
 * Check if the current request is authenticated
 * 
 * @example
 * // Basic usage - returns session or null
 * const session = await isAuthenticated();
 * if (!session) {
 *   return Response.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * 
 * @example
 * // Throw on failure - useful for API routes
 * const session = await isAuthenticated({ behavior: "error" });
 * // session is guaranteed to be defined here
 * 
 * @example
 * // With permission checking
 * const session = await isAuthenticated({
 *   behavior: "error",
 *   permissions: { urls: ["read", "write"] }
 * });
 */
export async function isAuthenticated(): Promise<Session | null>;
export async function isAuthenticated(options: AuthOptions & { behavior: "error" | "redirect" | "forbidden" }): Promise<Session>;
export async function isAuthenticated(options: AuthOptions & { behavior?: "null" }): Promise<Session | null>;
export async function isAuthenticated(options: AuthOptions = {}): Promise<Session | null> {
    const { behavior = "null", permissions } = options;

    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    // Check if session exists
    if (!session) {
        if (behavior === "error") {
            throw new UnauthenticatedError();
        }
        if (behavior === "redirect") {
            redirect("/login");
        }
        if (behavior === "forbidden") {
            forbidden();
        }
        return null;
    }

    // Check permissions if required
    if (permissions) {
        const hasRequiredPermissions = (await auth.api.userHasPermission({
            headers: requestHeaders,
            body: {
                permissions
            },
        })).success;

        if (!hasRequiredPermissions) {
            if (behavior === "error") {
                throw new InsufficientPermissionsError();
            }
            if (behavior === "redirect") {
                redirect("/login?error=insufficient-permissions");
            }
            if (behavior === "forbidden") {
                forbidden();
            }
            return null;
        }
    }

    return session;
}

export async function hasPermission(permissions: Record<string, string[]>): Promise<boolean> {
    const requestHeaders = await headers();
    return (await auth.api.userHasPermission({
        headers: requestHeaders,
        body: { permissions },
    })).success;
}