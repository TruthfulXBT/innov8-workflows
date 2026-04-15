#!/bin/bash
# Sync web files to native app projects
# Run this after making changes to the web app before building in Android Studio / Xcode

echo "Copying web files to www/..."
cp index.html style.css app.js config.js bubble-engine.js data-service.js portfolio.js custom-assets.js auth.js ads.js sw.js manifest.json favicon.svg vercel.json www/
cp *.png www/ 2>/dev/null

echo "Syncing to Android + iOS..."
node "node_modules/@capacitor/cli/bin/capacitor" sync

echo "Done! Open Android Studio or Xcode to build."
