function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
  "accountAssociation": {
    "header": "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4Y2EzRjlDN2ZBZWI2NTQ2Rjk5OTc5RWNiQjNjYzU3NmI5YWE2ZTZEZSJ9",
    "payload": "eyJkb21haW4iOiJkYXNoLXRyYWRpbmcudmVyY2VsLmFwcCJ9",
    "signature": "AAAAAAAAAAAAAAAAyhG94Fl3s2MRZwKIYr4qFzl2yhEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSCrVbLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAul7REO_bo9AFv8iC11NYrLu4WEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ_-6NvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAA_mDBmeRLsjY48uKwXGkTPV8Gf2YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAPhSELIcxQMC9He6VmhtIBncm2etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABB7rIEFSu65zfunEKA5DL0Uc4tJNd_-7CCyrw-DvpIn6E1Ysqppe6SzXMKFnWkhPHwJ71HCMpNQRR2JS9TDTp0AhsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJI"
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