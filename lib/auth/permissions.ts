import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    inventory: ["read", "read_all"],
    loan: ["create", "create_for_others", "read", "read_all", "return", "return_all"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
    inventory: ["read"],
    loan: ["create", "read", "return"],
});

export const admin = ac.newRole({
    ...adminAc.statements, 
    inventory: ["read", "read_all"],
    loan: ["create", "create_for_others", "read", "read_all", "return", "return_all"],
});
