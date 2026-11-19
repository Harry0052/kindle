export type NavIcon = "tonight" | "plans" | "create" | "friends";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export function navFor(signedIn: boolean): NavItem[] {
  const tonight: NavItem = { href: "/", label: "Tonight", icon: "tonight" };
  if (!signedIn) return [tonight];
  return [
    tonight,
    { href: "/plans", label: "Plans", icon: "plans" },
    { href: "/create", label: "Create", icon: "create" },
    { href: "/friends", label: "Friends", icon: "friends" },
  ];
}
