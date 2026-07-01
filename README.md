# Guest Video Book PWA

A private, offline-first wedding guest video book that records videos on an iPad and saves them locally in the browser using IndexedDB.

## Important privacy note

This app has no server, no login, and no cloud upload. Videos are stored inside the browser storage on the iPad that records them.

Because the videos live in browser storage, do not clear Safari website data until you have downloaded/exported the videos.

## Files

- `index.html` - main app screen
- `styles.css` - wedding-themed iPad UI
- `app.js` - camera, recorder, gallery, export logic
- `db.js` - local IndexedDB video storage
- `sw.js` - offline service worker
- `manifest.webmanifest` - PWA install settings
- `icons/` - app icons

## Run locally on Mac for iPad testing

1. Put this folder somewhere on your Mac.
2. Open Terminal.
3. Go into the folder:

```bash
cd path/to/guest-video-book-pwa
```

4. Start a local web server:

```bash
python3 -m http.server 8080
```

5. Find your Mac's local IP address:

```bash
ipconfig getifaddr en0
```

6. On the iPad, open Safari and visit:

```text
http://YOUR-MAC-IP:8080
```

Example:

```text
http://192.168.1.25:8080
```

7. Safari will ask for camera and microphone permission. Allow it.
8. Tap Share > Add to Home Screen.
9. Open the app from the Home Screen.

## Wedding day use

- Open the app from the iPad Home Screen.
- Tap **Record a Message**.
- Guest enters their name.
- Guest records their message.
- Guest reviews it.
- Guest taps **Save Video**.
- The video is saved locally on that iPad.

## Exporting videos

Go to **View Saved Videos**. Each saved video has a **Download** button. Use that to save each video to Files, AirDrop, or move them later.

The **Export List** button downloads a CSV list of names, dates, and filenames.

## Notes for iPad

- Keep the iPad charged.
- Turn on Guided Access if you do not want guests leaving the app.
- Do not clear Safari data before exporting videos.
- Test before the wedding with a few sample recordings.
