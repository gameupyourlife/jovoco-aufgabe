import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    inventory: ["read", "read_all", "create", "update", "retire"],
    loan: ["create", "create_for_others", "read", "read_all", "return", "return_all"],
    reservation: ["create", "create_for_others", "read", "read_all", "cancel", "cancel_all", "pickup", "pickup_all"],
    loan_settings: ["read", "manage"],
    report: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
    inventory: ["read"],
    loan: ["create", "read", "return"],
    reservation: ["create", "read", "cancel", "pickup"],
    report: ["read"],
});

export const admin = ac.newRole({
    ...adminAc.statements, 
    inventory: ["read", "read_all", "create", "update", "retire"],
    loan: ["create", "create_for_others", "read", "read_all", "return", "return_all"],
    loan_settings: ["read", "manage"],
    reservation: ["create", "create_for_others", "read", "read_all", "cancel", "cancel_all", "pickup", "pickup_all"],
    report: ["read"],
});
