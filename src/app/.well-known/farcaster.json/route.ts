function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
  "accountAssociation": { 
    "header": "eyJmaWQiOjEzNTYxNTEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgzZDBEMTFBRUE2OGNmZTM1NDg4YkZGMEY3Y2M5MGFiM0EwZTQwZGJBIn0",
    "payload": "eyJkb21haW4iOiJkYXNoLXRyYWRpbmcudmVyY2VsLmFwcCJ9",
    "signature": "NfmktQ1ZF7ODQcOxuZmgQUS3FGcF56Uwoo0S6sN6YlQHBQ3yEeQRx+beCVGFz9Gsdhg5gt6DyB0RCtZEjTiyzxs="
  },
  "miniapp": {
    "version": "1",
    "name": "Dash",
    "homeUrl": "https://ex.co",
    "iconUrl": "https://ex.co/i.png",
    "splashImageUrl": "https://ex.co/l.png",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://ex.co/api/webhook",
    "subtitle": "One Look. One Tap. One Trade",
    "description": "Dash turns decisions into instant execution.",
    "screenshotUrls": [
      "https://ex.co/s1.png",
      "https://ex.co/s2.png",
      "https://ex.co/s3.png"
    ],
    "primaryCategory": "finance",
    "tags": ["defi", "baseapp", "trade", "tap-to-trade", "gasless"],
    "heroImageUrl": "https://ex.co/og.png",
    "tagline": "One Look. One Tap. One Trade",
    "ogTitle": "Dash",
    "ogDescription": "Dash turns decisions into instant execution",
    "ogImageUrl": "https://ex.co/og.png",
    "noindex": true
  }
}); 
}