import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  ADMIN_PERMISSIONS,
  isAdminRole,
  sanitizePermissions,
} from "@/lib/admin-permissions";
import { updateAdminUser } from "@/lib/admin-staff-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.staff);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const role =
      typeof body.role === "string" && isAdminRole(body.role) ? body.role : undefined;

    if (role === "master" && admin.session.role !== "master") {
      return NextResponse.json(
        { error: "Only a master admin can assign the master role." },
        { status: 403 },
      );
    }

    const useRoleDefaults = body.useRoleDefaults === true;
    const clearOverrides = body.useRoleDefaults === true;
    const permissions =
      body.permissions === undefined && !clearOverrides
        ? undefined
        : useRoleDefaults || body.permissions === null
          ? null
          : sanitizePermissions(body.permissions);

    const user = await updateAdminUser(
      id,
      {
        email: typeof body.email === "string" ? body.email : undefined,
        name: typeof body.name === "string" ? body.name : undefined,
        password: typeof body.password === "string" ? body.password : undefined,
        role,
        permissions,
        active: typeof body.active === "boolean" ? body.active : undefined,
      },
      admin.session.id,
    );

    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update staff account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
