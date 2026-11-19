/**
 * External products Kindle does not call.
 * Keep these false until a real account is configured. Do not flip them to
 * simulate a response.
 */
export const flags = {
  contactsImport: false,
  liveLocation: false,
  publicMap: false,
  venuePartners: false,
  emailDelivery: false,
  smsDelivery: false,
  pushNotifications: false,
  identityVerification: false,
  payments: false,
} as const;

export function disabledReason(flag: keyof typeof flags) {
  const reasons: Record<keyof typeof flags, string> = {
    contactsImport: "Kindle does not read the contacts on your phone.",
    liveLocation: "Kindle does not use GPS or live location.",
    publicMap: "No map is connected. Plans show an area name, not a pin.",
    venuePartners: "Venue suggestions are not connected.",
    emailDelivery: "Kindle does not send email.",
    smsDelivery: "Kindle does not send text messages.",
    pushNotifications: "Kindle does not send push notifications. Updates stay in the app.",
    identityVerification: "Kindle records your 18+ confirmation. It does not verify identity.",
    payments: "Kindle does not take payment.",
  };
  return reasons[flag];
}
