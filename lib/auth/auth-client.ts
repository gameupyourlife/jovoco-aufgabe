import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin as adminUser, user } from "@/lib/auth/permissions";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000",

    plugins: [
        adminClient({
            ac,
            roles: {
                admin: adminUser,
                user,
            }
        })
    ]
})