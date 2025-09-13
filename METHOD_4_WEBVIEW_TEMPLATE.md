# Method 4: WebView Template - Step by Step

## Step 1: Download Android Studio
1. Go to https://developer.android.com/studio
2. Download and install Android Studio
3. Install Android SDK (will prompt during setup)

## Step 2: Create New Project
1. Open Android Studio
2. Click "Create New Project"
3. Select "Empty Activity"
4. Set:
   - Name: `Daily Reminder`
   - Package: `com.yourname.dailyreminder`
   - Language: `Java`
   - Minimum SDK: `API 21`

## Step 3: Replace MainActivity.java
**File: `app/src/main/java/com/yourname/dailyreminder/MainActivity.java`**
```java
package com.yourname.dailyreminder;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        
        // WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Set clients
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        
        // Load your app URL
        webView.loadUrl("https://yourdomain.com"); // Replace with your URL
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

## Step 4: Replace activity_main.xml
**File: `app/src/main/res/layout/activity_main.xml`**
```xml
<?xml version="1.0" encoding="utf-8"?>
<WebView xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/webview"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

## Step 5: Update AndroidManifest.xml
**File: `app/src/main/AndroidManifest.xml`**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourname.dailyreminder">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Daily Reminder"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        android:usesCleartextTraffic="true">
        
        <activity android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Step 6: Update App Icon (Optional)
1. Right-click `app/src/main/res`
2. New → Image Asset
3. Choose icon type: Launcher Icons
4. Upload your app icon
5. Generate

## Step 7: Update App Name
**File: `app/src/main/res/values/strings.xml`**
```xml
<resources>
    <string name="app_name">Daily Reminder</string>
</resources>
```

## Step 8: Build APK
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create new keystore:
   - Key store path: Choose location
   - Password: Create strong password
   - Key alias: `dailyreminder`
   - Validity: 25 years
4. Build release APK
5. APK will be in `app/release/` folder

## Step 9: Install APK
1. Transfer APK to Android device
2. Enable "Unknown Sources" in Settings
3. Install APK
4. Test all features

## Quick Template Download
**Alternative: Use existing template**
1. Search GitHub for "android webview template"
2. Clone repository
3. Replace URL in MainActivity.java
4. Update app name, icon, package name
5. Build APK

## Popular Templates:
- `https://github.com/slymax/webview`
- `https://github.com/mgks/Android-SmartWebView`

## Customization Options:
- Splash screen
- Custom loading screen
- Offline page
- Push notifications
- File upload support
- Camera access

This method gives you full control over the APK without any third-party services.