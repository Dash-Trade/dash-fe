function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
  "accountAssociation": {
    "header": "",
    "payload": "",
    "signature":""
  },
  "miniapp": {
    "version": "1",
    "name": "Dash Trade",
    "homeUrl": "https://dash-trading.vercel.app/",
    "iconUrl": "https://dash-trading.vercel.app/dash-polos.png",
    "splashImageUrl": "https://dash-trading.vercel.app/og-banner.png",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://dash-trading.vercel.app/api/webhook",
    "subtitle": "One Look. One Tap. One Trade",
    "description": "Dash turns decisions into instant execution.",
    "screenshotUrls": [
      "https://dash-trading.vercel.app/TapPosition.png",
      "https://dash-trading.vercel.app/TapProfit.png",
      "https://dash-trading.vercel.app/DEX.png"
    ],
    "primaryCategory": "finance",
    "tags": ["defi", "baseapp", "trade", "tap-to-trade", "gasless"],
    "heroImageUrl": "https://dash-trading.vercel.app/og-banner.png",
    "tagline": "One Look. One Tap. One Trade",
    "ogTitle": "Dash Trade",
    "ogDescription": "Dash turns decisions into instant execution",
    "ogImageUrl": "https://dash-trading.vercel.app/og-banner.png",
    "noindex": false
  }
}); 
}