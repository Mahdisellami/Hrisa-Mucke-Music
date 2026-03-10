# Music Tool - Makefile
# Quick commands for development and deployment
#
# Compatible with macOS and Linux
# Requires: make, bash, python3, node/npm, docker (optional)

.PHONY: help backend mobile android ios-expo ios-build ios-update clean install db data docker-up docker-down network-ip health

# Default target - show help
help:
	@echo "Music Tool - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  make install        - Install all dependencies (backend + mobile)"
	@echo "  make backend        - Start FastAPI backend server"
	@echo "  make mobile         - Start Expo mobile dev server"
	@echo "  make docker-up      - Start all services with Docker Compose"
	@echo "  make docker-down    - Stop all Docker services"
	@echo ""
	@echo "Database & Data:"
	@echo "  make db             - Populate database (music.json)"
	@echo "  make data           - Download MP3s from YouTube"
	@echo "  make db-data        - Run both db and data sequentially"
	@echo ""
	@echo "Production Builds:"
	@echo "  make android        - Build Android APK (requires Android Studio)"
	@echo "  make android-eas    - Build Android APK using EAS (cloud-based)"
	@echo "  make ios-expo       - Start dev server for iOS (free, same Wi-Fi needed)"
	@echo "  make ios-build      - Build permanent iOS app (requires Apple Developer \$$99/year)"
	@echo "  make ios-update     - Push updates to existing iOS build"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean build artifacts and caches"
	@echo "  make logs           - Show Docker logs"
	@echo "  make network-ip     - Show network IP for mobile testing"
	@echo "  make health         - Quick health check"
	@echo ""

# ============================================
# INSTALLATION
# ============================================

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo ""
	@echo "Installing mobile dependencies..."
	cd mobile-app && npm install
	@echo ""
	@echo "✅ Installation complete!"
	@echo ""
	@echo "Note: EAS CLI is included in mobile dependencies"
	@echo "To use iOS/Android builds, create a free Expo account:"
	@echo "  https://expo.dev"

# ============================================
# DEVELOPMENT
# ============================================

backend:
	@echo "Starting FastAPI backend on http://localhost:8000"
	cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

mobile:
	@echo "Starting Expo dev server..."
	@echo "Scan QR code with Expo Go app to test on your phone"
	cd mobile-app && npm start

docker-up:
	@echo "Starting all services with Docker Compose..."
	docker-compose up

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

logs:
	@echo "Showing Docker logs (Ctrl+C to exit)..."
	docker-compose logs -f

# ============================================
# DATABASE & DATA MANAGEMENT
# ============================================

db:
	@echo "Populating music database (music.json)..."
	python3 populate_db.py

data:
	@echo "Downloading MP3 files from YouTube..."
	@echo "This may take a while depending on number of tracks..."
	python3 populate_data.py

db-data: db data
	@echo "✅ Database and data population complete!"

# ============================================
# PRODUCTION BUILDS
# ============================================

android:
	@echo "Building Android APK for production..."
	@echo ""
	@echo "⚠️  This requires Android Studio and Android SDK to be installed"
	@echo "    See: https://docs.expo.dev/guides/local-app-development/"
	@echo ""
	@echo "Building..."
	cd mobile-app && npx expo run:android --variant release
	@echo ""
	@echo "✅ APK built successfully!"
	@echo "📁 Location: mobile-app/android/app/build/outputs/apk/release/app-release.apk"
	@echo ""
	@echo "To share with friends:"
	@echo "  1. Send them the APK file"
	@echo "  2. They enable 'Install from Unknown Sources' on Android"
	@echo "  3. They tap the APK to install"

ios-expo:
	@echo "📱 iOS Distribution via Expo Go (100%% Free)"
	@echo "============================================"
	@echo ""
	@echo "For FREE iOS distribution (no Apple Developer account needed),"
	@echo "friends must be on the same network as your computer."
	@echo ""
	@echo "Starting Expo development server..."
	@echo "Share the QR code below with friends on the same Wi-Fi."
	@echo ""
	@echo "Setup for friends:"
	@echo "  1. Download 'Expo Go' app from App Store"
	@echo "  2. Connect to the same Wi-Fi as you"
	@echo "  3. Scan the QR code below"
	@echo "  4. Backend must be running (make backend or docker-compose up)"
	@echo "  5. Configure backend IP in Connection tab"
	@echo ""
	@echo "Note: This requires you to keep the dev server running."
	@echo "For a permanent solution, you need an Apple Developer account (\$$99/year)."
	@echo ""
	cd mobile-app && npx expo start

ios-build:
	@echo "📱 iOS Build via EAS (Requires Apple Developer Account)"
	@echo "======================================================="
	@echo ""
	@echo "⚠️  This requires an Apple Developer account (\$$99/year)"
	@echo "    Sign up at: https://developer.apple.com"
	@echo ""
	@echo "This creates a permanent build for Expo Go."
	@echo "One-time setup: cd mobile-app && npx eas login"
	@echo ""
	@echo "Building..."
	@echo ""
	cd mobile-app && npx eas build --platform ios --profile development
	@echo ""
	@echo "✅ Build complete! Share the link with friends."
	@echo "To push updates: make ios-update"

ios-update:
	@echo "📱 Pushing Update to iOS Build"
	@echo "==============================="
	@echo ""
	@echo "Pushing update to your EAS build..."
	@echo ""
	cd mobile-app && npx eas update --branch development --message "Update: $(shell date '+%Y-%m-%d %H:%M')"
	@echo ""
	@echo "✅ Update pushed! Friends will get it on next app launch."

# Build Android using EAS (cloud-based, requires Expo account)
android-eas:
	@echo "Building Android APK using EAS Build (cloud)..."
	@echo ""
	@echo "⚠️  This requires an Expo account (free tier available)"
	@echo "    Sign up at: https://expo.dev/"
	@echo ""
	@echo "Building..."
	cd mobile-app && eas build --platform android --profile preview
	@echo ""
	@echo "✅ APK will be available in your Expo dashboard"
	@echo "🌐 Visit: https://expo.dev/accounts/[your-account]/projects/mobile-app/builds"

# ============================================
# UTILITIES
# ============================================

clean:
	@echo "Cleaning build artifacts and caches..."
	rm -rf mobile-app/.expo
	rm -rf mobile-app/node_modules/.cache
	rm -rf mobile-app/android/app/build
	rm -rf mobile-app/ios/build
	rm -rf backend/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup complete!"

# Check network IP for mobile testing (cross-platform)
network-ip:
	@echo "Your network IP addresses:"
	@if command -v ip > /dev/null 2>&1; then \
		ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $$2}' | cut -d/ -f1; \
	elif command -v ifconfig > /dev/null 2>&1; then \
		ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $$2}'; \
	else \
		echo "  ⚠️  Could not detect network tool (ip or ifconfig)"; \
		echo "  Please check your network settings manually"; \
	fi
	@echo ""
	@echo "Update mobile-app/api/client.ts with one of these IPs"

# Quick health check
health:
	@echo "Health Check"
	@echo "============"
	@echo ""
	@echo "Backend:"
	@curl -s http://localhost:8000/music > /dev/null && echo "  ✅ Backend running on http://localhost:8000" || echo "  ❌ Backend not running"
	@echo ""
	@echo "Database:"
	@test -f music.json && echo "  ✅ music.json exists" || echo "  ❌ music.json not found"
	@echo ""
	@echo "Data Directory:"
	@test -d data && echo "  ✅ data/ directory exists" || echo "  ❌ data/ directory not found"
