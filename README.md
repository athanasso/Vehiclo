# Vehiclo 🚗

AI-powered vehicle management app built with Expo & React Native. Track fuel, trips, maintenance, and expenses — with voice logging, trip cost comparison, and gig worker support.

## Features

### Core
- **Dashboard** — Realistic Vehicle Health Score (factors in mileage, age, overdue service, and log consistency), quick stats, monthly spending chart
- **Fuel Logs** — Track fill-ups with auto fuel economy calculation. Flexible entry modes (Total Cost vs Volume) with full inline edit/delete and OCR receipt scanning.
- **Trip Logs & Auto-Tracking** — Log trips manually. Alternatively, enable Native Android Activity Recognition background tracking: a themed auto-detection modal proactively intercepts pending drives and asks to import them upon returning to the app, now complete with a drawn SVG route map of your GPS points.
- **Maintenance** — Service history with smart auto-fill intervals (time & mileage), scheduled local push notifications, custom reminder messages, and full inline edit/delete support
- **Vehicle Check** — DIY inspection checklist covering 15 items (engine oil, coolant, tire pressure, brakes, lights, etc.) with Good/Low/Attention status, reminder scheduling, edit support, and full history
- **Expense Tracking** — Category breakdown with visual charts
- **Document Storage** — Store registration, insurance, inspection docs with expiry alerts
- **Settings & Localization** — Dynamic unit switching (km/mi, L/gal, L/100km / MPG), support for 15+ currencies, and localized native Date Pickers (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)

### AI & ML Features
- **Voice Logger** — Speak to log fuel, trips, or expenses with live transcriptions (Powered by Native Android `SpeechRecognizer` via custom Expo module)
- **OCR Scanning** — Fully offline, on-device receipt scanning using Google ML Kit Text Recognition with heuristic pattern extraction
- **Trip Cost Comparison** — Compare your actual driving cost against Uber and taxi fares

### Pro
- **Solo Driver Mode** — Session tracking for gig workers (Uber, Bolt, Lyft, DoorDash) with earnings, fuel cost, profit tracking, and session delete support

### Multi-Vehicle & Bi-Fuel Support
- Manage multiple vehicles with a horizontal vehicle selector
- **Full Vehicle Management** — View and edit vehicle details (VIN, license plates, capacities) directly from the app
- **Bi-Fuel Engine Support** — Dashboard splits and isolates Primary (Petrol) and Secondary (LPG/CNG) fuel economy stats for precise engine health monitoring, alongside total blended cost
- Full EV support: battery %, charge range, hybrid/electric type detection

### Auth, Sync & Cloud Storage
- **Offline-First Storage** — Zero-latency UI updates using AsyncStorage, with optimistic background synchronization to Supabase Postgres.
- **Supabase Cloud Storage Pipeline** — Built-in native file interception utilizing `FormData` multipart payloads to bypass React Native core Blob network bugs.
  - **Public Avatars**: Custom uploaded vehicle photos and synced Google OAuth user profile pictures pull securely via Public endpoints, enabling aggressive `expo-image` local caching without token overhead.
  - **Private Document Vault**: Sensitive vehicle registrations, receipts, and insurance PDFs are funneled into a strictly RLS-protected Private Bucket. The app dynamically generates secure, ephemeral 1-hour Signed URLs for native `WebBrowser` viewing. 
- Animated welcome/splash screen with loading transition
- **Authentication** — Fully integrated Supabase cloud authentication (Email/Password, Google OAuth, or Guest Mode)
- Dark / Light / System theme toggle with persistence

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [Expo SDK 54](https://expo.dev) + React Native 0.81 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| State | React Context + AsyncStorage (Offline-First) |
| Animations | React Native Reanimated + Animated API |
| Database/Auth | [Supabase](https://supabase.com) (`@supabase/supabase-js`) |
| Push Notifications | `expo-notifications` |
| Background Tracking | Custom Native Kotlin Module (`activity-recognition`) |
| Machine Learning | Custom Native Kotlin Module (`mlkit-ocr` + `SpeechRecognizer`) |
| Charts | `react-native-svg` |
| Icons | @expo/vector-icons (Ionicons) |
| Camera/Docs | expo-camera, expo-image-picker, expo-document-picker |

## Project Structure

```
modules/
  activity-recognition/    # Custom Expo Local Module tracking native IN_VEHICLE transitions
  mlkit-ocr/               # Custom Native Module with Google ML Kit & Android SpeechRecognizer
app/
  _layout.tsx              # Root layout with auth/theme/settings/data providers
  welcome.tsx              # Auth screen (splash → login/guest)
  (tabs)/
    _layout.tsx            # 5-tab navigator
    index.tsx              # Dashboard
    fuel.tsx               # Fuel & Trips
    maintenance.tsx        # Service & Maintenance
    expenses.tsx           # Expense tracking
    more.tsx               # Settings, vehicles, pro features
  modals/
    add-vehicle.tsx        # Add vehicle form (gas/diesel/EV/hybrid)
    add-fuel.tsx           # Add fuel log
    add-trip.tsx           # Add trip with cost comparison
    add-maintenance.tsx    # Add service record
    add-expense.tsx        # Add expense
    solo-driver.tsx        # Gig worker session tracking
    trip-comparison.tsx    # Your cost vs Uber/taxi analysis
    vehicle-check.tsx      # DIY inspection checklist with reminders
    documents.tsx          # Document storage & scanning
    voice-logger.tsx       # Voice-to-log AI parser

components/
  ui/index.tsx             # UI component library
  HealthGauge.tsx          # Animated SVG health score ring
  VehicleSelector.tsx      # Multi-car horizontal selector
  MiniBarChart.tsx         # Monthly expense bar chart
  ImportTripModal.tsx      # Bottom-sheet modal for importing auto-detected drives

contexts/
  AuthContext.tsx           # Auth state (guest + Supabase-ready)
  DataContext.tsx           # Central data CRUD + AsyncStorage
  SettingsContext.tsx       # Units, currency, and localization state
  ThemeContext.tsx          # Dark/light/system theme persistence

types/index.ts             # TypeScript data models
utils/
  storage.ts               # AsyncStorage wrapper
  calculations.ts          # Health score, fuel economy, trip comparison
  formatters.ts            # Currency, distance, date formatting
  notifications.ts         # Local push notification scheduler
  driving-detector.ts      # Background location tracking & Haversine formula
  supabase.ts              # Supabase client & config
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on web (for testing)
npx expo start --web
```

## Environment Variables

Create a `.env` file in the root directory for Supabase authentication to work:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## License

MIT
