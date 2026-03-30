# Tailwind + React + Redux Architecture Plan

## Overview
This document outlines the architecture for a React application using Tailwind CSS for styling and Redux Toolkit for state management.

## Technology Stack
- **React 18** (via Vite)
- **Tailwind CSS 4** (utility-first CSS framework)
- **Redux Toolkit** (state management)
- **React Redux** (React bindings for Redux)

## Folder Structure
```
client/
├── src/
│   ├── app/                  # App-level configuration
│   │   └── store.js          # Redux store configuration
│   ├── features/             # Feature-specific Redux slices
│   │   └── counter/          # Example feature
│   │       ├── counterSlice.js
│   │       └── counter.test.js (optional)
│   ├── widgets/              # Reusable UI components
│   ├── App.jsx               # Main App component
│   ├── main.jsx              # Entry point
│   ├── index.css             # Tailwind directives
│   └── assets/               # Static assets
├── public/                   # Static public files
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Key Implementation Details

### 1. State Management (Redux Toolkit)
- Store configured in `src/app/store.js`
- Features organized in `src/features/` with Redux slices
- Using `createSlice` for simplified reducer logic
- TypeScript-ready with RootState and AppDispatch types

### 2. Styling (Tailwind CSS)
- Configured via `tailwind.config.js` and `postcss.config.js`
- Base styles imported in `src/index.css` using Tailwind directives
- Utility-first approach for rapid UI development
- Responsive design prefixes (sm:, md:, lg:, xl:, 2xl:)

### 3. React Setup
- Vite for fast development and build
- React 18 with StrictMode
- React-Redux Provider wrapping the app
- Custom hooks: `useSelector` and `useDispatch`

### 4. Development Workflow
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Example Usage
See `src/App.jsx` for implementation showing:
- Counter state managed by Redux
- Tailwind classes for styling
- React-Redux integration
- Responsive design patterns

## Extending the Architecture
1. **Adding Features**: Create new folders in `src/features/` with their own slices
2. **Shared Components**: Place reusable UI components in `src/widgets/`
3. **API Integration**: Add RTK Query in `src/app/api.js` for data fetching
4. **Routing**: Add React Router in `src/app/routes.js` if needed
5. **Middleware**: Add custom middleware to store configuration as needed

## Best Practices Implemented
- Separation of concerns (features, widgets, app)
- Scalable folder structure
- TypeScript preparation
- Modern Redux patterns (RTK)
- Utility-first CSS with Tailwind
- Responsive design
- Performance-conscious (Vite + React 18)

## Next Steps
1. Replace the counter example with actual application features
2. Add authentication if needed (building on existing GitHub OAuth work)
3. Implement API services with RTK Query or custom hooks
4. Add form validation and UI component library
5. Set up testing framework (Vitest or Jest)
6. Configure ESLint and Prettier for code quality