const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const minikitConfig = {
  accountAssociation: { // this will be added in step 5
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "Dash Trade", 
    subtitle: "One Look. One Tap. One Trade", 
    description: "Dash turns decisions into instant execution",
    screenshotUrls: [
        `${ROOT_URL}/TapPosition.png`,
        `${ROOT_URL}/TapProfit.png`,
        `${ROOT_URL}/DEX.png`,

    ],
    iconUrl: `${ROOT_URL}/dash-polos.png`,
    splashImageUrl: `${ROOT_URL}/og-banner.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trade", "tap-to-trade", "defi", "gasless"],
    heroImageUrl: `${ROOT_URL}/og-banner.png`, 
    tagline: "One Look. One Tap. One Trade",
    ogTitle: "Dash Trade",
    ogDescription: "Dash turns decisions into instant execution",
    ogImageUrl: `${ROOT_URL}/og-banner.png`,
  },
} as const;