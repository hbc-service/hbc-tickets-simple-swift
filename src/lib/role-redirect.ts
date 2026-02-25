const employeeRoles = ["reinigung", "service", "sicherheit"];
const managerRoles = ["manager", "city_manager", "area_manager", "objektleiter"];
const adminRoles = ["admin", "geschaeftsfuehrung"];

export function getRoleRedirect(role: string | null | undefined): string {
  if (!role) return "/dashboard";
  const r = role.toLowerCase();
  if (employeeRoles.includes(r)) return "/dashboard/mitarbeiter";
  if (managerRoles.includes(r)) return "/dashboard/manager";
  if (adminRoles.includes(r)) return "/dashboard/admin";
  return "/dashboard";
}
