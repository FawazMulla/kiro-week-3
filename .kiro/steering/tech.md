# Technology Stack

## Build System & Framework

- **Build Tool**: Vite 7.2.4 - Modern frontend build tool with fast HMR
- **Module System**: ES Modules (type: "module" in package.json)
- **Runtime**: Vanilla JavaScript (no framework dependencies)

## Core Dependencies

### Production
- **chart.js** (4.5.1) - Canvas-based charting library for correlation visualizations
- **date-fns** (4.1.0) - Date utility library for time-based calculations

### Development & Testing
- **Vitest** (4.0.15) - Fast unit testing framework with Vite integration
- **@vitest/ui** (4.0.15) - Web UI for test visualization
- **jsdom** (27.3.0) - DOM implementation for testing
- **fast-check** (4.4.0) - Property-based testing library

### Styling
- **Tailwind CSS** (4.1.17) - Utility-first CSS framework
- **PostCSS** (8.5.6) + **Autoprefixer** (10.4.22) - CSS processing

## Common Commands

### Development
```bash
npm run dev          # Start development server with HMR
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Testing
```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest web UI
```

## Configuration Files

- **vitest.config.js**: Test configuration with jsdom environment and global test setup
- **tailwind.config.js**: Tailwind configuration with custom color palette and responsive breakpoints
- **postcss.config.js**: PostCSS configuration for Tailwind processing

## API Integration

- **Yahoo Finance API**: Stock data via query1.finance.yahoo.com
- **Reddit JSON API**: Meme data via reddit.com JSON endpoints
- **CORS**: Uses public JSON endpoints, no authentication required