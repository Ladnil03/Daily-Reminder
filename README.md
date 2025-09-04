# Daily Reminder PWA

A complete Progressive Web App for managing daily reminders with offline functionality.

## Features

- 📱 **Progressive Web App** - Install on any device
- 🔔 **Smart Notifications** - Browser and in-app notifications with custom sounds
- 💾 **Offline Functionality** - Works without internet connection
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Works on all screen sizes
- 🔒 **Local Authentication** - Secure user management with localStorage
- 🎵 **Custom Sounds** - Upload your own notification sounds

## Setup Instructions

1. **Generate Icons** (Optional):
   - Open `generate-icons.html` in a browser
   - Click the buttons to generate PWA icons
   - Save the generated icons in the `pwa/` folder

2. **Add Default Sound** (Optional):
   - Replace `assets/default.mp3` with your preferred notification sound
   - Or keep the generated beep sound (default behavior)

3. **Serve the Application**:
   - Use a local server (e.g., Live Server extension in VS Code)
   - Or use Python: `python -m http.server 8000`
   - Or use Node.js: `npx serve .`

4. **Access the App**:
   - Open `http://localhost:8000` in your browser
   - Register a new account or login
   - Start creating reminders!

## File Structure

```
Daily-reminder/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # Main app dashboard
├── about.html              # About page
├── contact.html            # Contact page
├── css/                    # Stylesheets
│   ├── index.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── about.css
│   └── contact.css
├── js/                     # JavaScript modules
│   ├── auth.js             # Authentication logic
│   ├── reminders.js        # Reminder management
│   ├── notifications.js    # Notification system
│   ├── theme.js            # Theme switching
│   ├── sw-register.js      # Service worker registration
│   └── contact.js          # Contact form handling
├── assets/                 # Media files
│   └── default.mp3         # Default notification sound
├── pwa/                    # PWA files
│   ├── manifest.json       # App manifest
│   ├── service-worker.js   # Service worker
│   └── icon-*.png          # App icons (generate these)
└── generate-icons.html     # Icon generator utility
```

## Usage

1. **Registration/Login**:
   - Create a new account or login with existing credentials
   - User data is stored locally in localStorage

2. **Creating Reminders**:
   - Click "Add Reminder" on the dashboard
   - Fill in title, description, date/time
   - Choose default sound or upload custom sound
   - Save the reminder

3. **Managing Reminders**:
   - View all reminders on the dashboard
   - Edit or delete existing reminders
   - Reminders automatically trigger notifications at scheduled time

4. **Notifications**:
   - Browser notifications (requires permission)
   - In-app notifications with sound
   - Works even when app is in background (PWA)

5. **PWA Installation**:
   - Click the install button when prompted
   - Or use browser's "Add to Home Screen" option
   - App works offline after installation

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial PWA support
- Mobile browsers: Full support

## Technical Details

- **Storage**: localStorage for user data and reminders
- **Notifications**: Web Notifications API + custom in-app notifications
- **Audio**: Web Audio API for default beep + File API for custom sounds
- **Offline**: Service Worker with cache-first strategy
- **Responsive**: CSS Grid and Flexbox
- **Theme**: CSS custom properties with localStorage persistence

## Customization

- **Colors**: Modify CSS custom properties in `:root`
- **Sounds**: Replace default.mp3 or use the Web Audio API beep
- **Icons**: Use generate-icons.html to create custom icons
- **Features**: All code is modular and well-commented for easy modification

## Security Notes

- All data is stored locally in the browser
- No server-side authentication or data transmission
- Passwords are stored in plain text (for demo purposes)
- In production, implement proper password hashing

## License

This project is open source and available under the MIT License.