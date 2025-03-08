# PhotoFlick

PhotoFlick is a sleek and modern photo management application built with Expo and React Native. The app helps users organize and manage their photo library efficiently, with a focus on providing an intuitive user experience.

## Features

- **Photo Organization**: Photos are automatically grouped by date for easy browsing
- **Photo Viewing**: Smooth swipe interface for browsing through photos
- **Delete Management**: "Delete Pile" feature to mark photos for deletion and confirm in batches
- **Dark/Light Theme**: Supports both dark and light modes for comfortable viewing in any environment
- **Permission Handling**: Properly requests and manages photo library access permissions

## Tech Stack

- [React Native](https://reactnative.dev/) - Core UI framework
- [Expo](https://expo.dev/) - Development platform and build tools
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing
- [TanStack Query](https://tanstack.com/query) - Data fetching and state management
- [Expo Media Library](https://docs.expo.dev/versions/latest/sdk/media-library/) - Access to photo library
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Animations
- [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur-view/) - UI effects
- [Async Storage](https://react-native-async-storage.github.io/async-storage/) - Persistent storage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator or Android Emulator (optional, for testing)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/PhotoFlick.git
   cd PhotoFlick
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server

   ```bash
   npx expo start
   ```

4. Run on your device:
   - For iOS: Press `i` in the terminal or scan the QR code with the Camera app
   - For Android: Press `a` in the terminal or scan the QR code with the Expo Go app

## Project Structure

- `/app` - Main application screens and components (using file-based routing)
- `/components` - Reusable UI components
- `/context` - React Context providers (Theme, Photos)
- `/types` - TypeScript type definitions
- `/utils` - Utility functions, hooks, and helper methods

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Uses [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- Photo management with [Expo Media Library](https://docs.expo.dev/versions/latest/sdk/media-library/)
