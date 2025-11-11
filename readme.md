# TaskGlitch - Task Management App

A task management application built for sales teams to track and prioritize work based on ROI calculations.

## What I Fixed

This project had 5 bugs that I tracked down and fixed:

### Bug 1: Double Fetch on Load
**Problem:** Tasks were loading twice when the app started  
**Solution:** Removed the duplicate useEffect that was racing with the main data loader in `src/hooks/useTasks.ts`

### Bug 2: Undo Snackbar Not Clearing
**Problem:** After the undo snackbar closed, you could still undo old deleted tasks  
**Solution:** Added `clearLastDeleted` function and called it properly when snackbar closes in `src/components/UndoSnackbar.tsx` and `src/App.tsx`

### Bug 3: Tasks Jumping Around
**Problem:** Tasks with same ROI and priority would randomly shuffle on every render  
**Solution:** Added alphabetical sorting by title as the final tie-breaker in `src/utils/logic.ts` sortTasks function

### Bug 4: Multiple Dialogs Opening
**Problem:** Clicking edit or delete would also open the task details dialog  
**Solution:** Added `e.stopPropagation()` to edit and delete click handlers in `src/components/TaskTable.tsx`

### Bug 5: ROI Calculation Errors
**Problem:** Division by zero and invalid inputs caused NaN and Infinity  
**Solution:** Added proper validation in `computeROI` function in `src/utils/logic.ts` to handle edge cases

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Material-UI for components
- MUI X Charts for visualizations

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Building

```bash
npm run build
```

## Features

- Add, edit, and delete tasks
- Calculate ROI automatically (Revenue / Time)
- Sort by ROI and priority
- Filter by status and priority
- Search tasks
- View analytics and charts
- Export to CSV
- Undo delete within 4 seconds

## Project Structure

```
src/
├── components/     # UI components
├── context/        # React context providers
├── hooks/          # Custom hooks
├── utils/          # Helper functions
└── types.ts        # TypeScript types
```

## Notes

- All data is stored in memory (no backend)
- Initial tasks load from `public/tasks.json`
- ROI calculation handles division by zero safely
- Sorting is stable and deterministic