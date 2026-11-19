export type NavIcon = "tonight" | "plans" | "create" | "friends";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export function navFor(signedIn: boolean): NavItem[] {
  const tonight: NavItem = { href: "/", label: "Tonight", icon: "tonight" };
  if (!signedIn) return [tonight];
  return [tonight];
}
