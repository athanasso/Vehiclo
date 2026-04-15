# Vehiclo 🚗

AI-powered vehicle management app built with Expo & React Native. Track fuel, trips, maintenance, and expenses — with voice logging, trip cost comparison, and gig worker support.

## Features

### Core
- **Dashboard** — Realistic Vehicle Health Score (factors in mileage, age, overdue service, and log consistency), quick stats, monthly spending chart
- **Fuel Logs** — Track fill-ups with auto fuel economy calculation
- **Trip Logs & Auto-Tracking** — Log trips manually or enable Background GPS Tracking to automatically detect and import your drives
- **Maintenance** — Service history with scheduled local push notifications for upcoming/overdue services
- **Expense Tracking** — Category breakdown with visual charts
- **Document Storage** — Store registration, insurance, inspection docs with expiry alerts
- **Settings & Localization** — Dynamic unit switching (km/mi, L/gal, L/100km / MPG) and support for 15+ currencies

### AI Features
- **Voice Logger** — Speak to log fuel, trips, or expenses with natural language parsing
- **OCR Scanning** — Camera-based receipt and document capture
- **Trip Cost Comparison** — Compare your actual driving cost against Uber and taxi fares

### Pro
- **Solo Driver Mode** — Session tracking for gig workers (Uber, Bolt, Lyft, DoorDash) with earnings, fuel cost, and profit tracking

### Multi-Vehicle & EV Support
- Manage multiple vehicles with a horizontal vehicle selector
- Full EV support: battery %, charge range, hybrid/electric type detection
- Gas, diesel, electric, and hybrid vehicles supported

### Auth & Theme
- Animated welcome/splash screen with loading transition
- **Authentication** — Fully integrated Supabase cloud authentication (Email/Password, Google OAuth, or Continue as Guest)
- Dark / Light / System theme toggle with persistence

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [Expo SDK 54](https://expo.dev) + React Native 0.81 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| State | React Context + AsyncStorage |
| Animations | React Native Reanimated + Animated API |
| Database/Auth | [Supabase](https://supabase.com) (`@supabase/supabase-js`) |
| Push Notifications | `expo-notifications` |
| Background GPS | `expo-location` + `expo-task-manager` |
| Charts | `react-native-svg` |
| Icons | @expo/vector-icons (Ionicons) |
| Camera/Docs | expo-camera, expo-image-picker, expo-document-picker |

## Project Structure

```
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
