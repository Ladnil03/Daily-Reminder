# Convert PWA to Android APK

## Method 1: PWA Builder (Recommended)
1. Go to https://www.pwabuilder.com/
2. Enter your website URL: `http://your-domain.com`
3. Click "Start" → "Build My PWA"
4. Download Android APK
5. Install on phone

## Method 2: Capacitor (Advanced)
```bash
npm install -g @capacitor/cli
npx cap init "Daily Reminder" "com.dailyreminder.app"
npx cap add android
npx cap copy
npx cap open android
```

## Method 3: Quick APK Generator
Use online tools:
- https://appmaker.xyz/pwa-to-apk
- https://gonative.io/
- https://webintoapp.com/

## Current PWA Issues Fix
The PWA needs to be served from HTTPS domain for full functionality.

### Deploy to Free Hosting:
1. **Netlify**: Drag & drop your folder
2. **Vercel**: Connect GitHub repo
3. **GitHub Pages**: Enable in repo settings

### Then use PWA Builder to create APK from HTTPS URL