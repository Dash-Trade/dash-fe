const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjIzNjM5NTgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg0RjUxMzVGNzVBRjdFMDNGMWRCQTY5Mzk5YjczZUQ3MmY5Njc5QzU2In0",
    payload: "eyJkb21haW4iOiJkYXNoLXRyYWRpbmcudmVyY2VsLmFwcCJ9",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEHDy5niG1K86kkgq_kY99e1__yHtIKKLZ0EGxdOkO06WWE6nEYYv02kE3Orq4zZtcq3y5QfuxFEtGcOCLkUkYspGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  },
  miniapp: {
    version: "1",
    name: "Dash Trade",
    subtitle: "One Look. One Tap. One Trade.",
    description: "Dash turns decisions into instant execution",
    screenshotUrls: [
      `${ROOT_URL}/assets/TapPosition.png`,
      `${ROOT_URL}/assets/TapProfit.png`,
      `${ROOT_URL}/assets/DEX.png`
    ],
    iconUrl: `${ROOT_URL}/dash-polos.png`,
    splashImageUrl: `${ROOT_URL}/assets/og-banner.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trade", "tap-to-trade", "gasless", "defi"],
    heroImageUrl: `${ROOT_URL}/assets/og-banner.png`,
    tagline: "One Look. One Tap. One Trade.",
    ogTitle: "Dash Trade",
    ogDescription: "Dash turns decisions into instant execution",
    ogImageUrl: `${ROOT_URL}/assets/og-banner.png`,
  },
} as const;