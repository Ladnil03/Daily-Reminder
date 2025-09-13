# Fix PWA Installation Issue

## Problem
"Add to Home Screen" creates shortcut instead of installing app.

## Requirements for PWA Installation

### ✅ Must Have:
1. **HTTPS** - App must be served over HTTPS
2. **Service Worker** - Must be registered and active
3. **Manifest** - Valid web app manifest
4. **Icons** - 192x192 and 512x512 PNG icons
5. **Start URL** - Must be accessible
6. **Display Mode** - Must be standalone/fullscreen

## Quick Fixes

### 1. Serve Over HTTPS
```bash
# Local testing with HTTPS
npx serve -s . --ssl-cert cert.pem --ssl-key key.pem

# Or use ngrok for HTTPS tunnel
npx ngrok http 3000
```

### 2. Check Service Worker
Open DevTools → Application → Service Workers
- Must show "Activated and running"
- If not, refresh page

### 3. Validate Manifest
Open DevTools → Application → Manifest
- Check for errors
- Icons must load properly
- All required fields present

### 4. Test Installation Criteria
Open DevTools → Console, run:
```javascript
// Check if PWA installable
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA is installable!');
});
```

## Common Issues

### Issue: Creates Shortcut Instead of App
**Cause:** Missing HTTPS or invalid manifest
**Fix:** 
1. Use HTTPS server
2. Check manifest validation
3. Ensure service worker is active

### Issue: No Install Prompt
**Cause:** PWA criteria not met
**Fix:**
1. Serve over HTTPS
2. Valid service worker
3. Valid manifest with icons
4. User engagement (visit site multiple times)

### Issue: Icons Not Loading
**Cause:** Incorrect icon paths
**Fix:** Use proper PNG files instead of base64

## Testing Steps

1. **Host on HTTPS** (required for PWA)
2. **Open in Chrome mobile**
3. **Visit site 2-3 times** (engagement requirement)
4. **Look for install banner** or menu option
5. **Should say "Install" not "Add to Home Screen"**

## Deployment Options

### Free HTTPS Hosting:
- **Netlify** - Drag & drop deployment
- **Vercel** - GitHub integration
- **GitHub Pages** - Free static hosting
- **Firebase Hosting** - Google's platform

### Quick Deploy:
```bash
# Netlify
npx netlify-cli deploy --prod --dir .

# Vercel
npx vercel --prod

# Firebase
npx firebase deploy
```

## Verification
After fixing:
1. Open site on mobile Chrome
2. Should see "Install Daily Reminder" instead of "Add to Home Screen"
3. Installed app opens in standalone mode (no browser UI)
4. Works offline

**Key:** HTTPS is mandatory for PWA installation!