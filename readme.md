# TaskGlitch - Bug Fixes Report

## Overview
This document details all 5 bugs found in the TaskGlitch application and their fixes.

---

## BUG 1: Double Fetch Issue ✅

### Location
`src/hooks/useTasks.ts` - Lines 58-75 and 77-91

### Problem
The application has TWO useEffect hooks that both fetch data:
1. **First useEffect** (lines 58-75): Legitimate data loader
2. **Second useEffect** (lines 77-91): Injected bug that causes duplicate fetch

The second effect runs with a `setTimeout` of 0ms and appends duplicate tasks to the state.

### Root Cause
```typescript
// BUGGY CODE - Second useEffect
useEffect(() => {
  const timer = setTimeout(() => {
    (async () => {
      try {
        const res = await fetch('/tasks.json');
        if (!res.ok) return;
        const data = (await res.json()) as any[];
        const normalized = normalizeTasks(data);
        setTasks(prev => [...prev, ...normalized]); // DUPLICATES!
      } catch {}
    })();
  }, 0);
  return () => clearTimeout(timer);
}, []);
```

### Fix
**Remove the entire second useEffect hook** (lines 77-91)

---

## BUG 2: Undo Snackbar Bug ✅

### Location
`src/hooks/useTasks.ts` - Line 109 (deleteTask function)

### Problem
When the snackbar closes (either auto-close or manual close), the `lastDeleted` state is NOT cleared. This means:
- User deletes Task A → snackbar shows
- Snackbar closes → `lastDeleted` still holds Task A
- User deletes Task B → snackbar shows
- If user clicks Undo, it might restore Task A instead of Task B

### Root Cause
The `UndoSnackbar` component's `onClose` handler in `App.tsx` doesn't actually clear the `lastDeleted` state.

### Fix
Modify the `UndoSnackbar` component to call `onClose` properly when the snackbar auto-closes:

**In `src/components/UndoSnackbar.tsx`:**
```typescript
export default function UndoSnackbar({ open, onClose, onUndo }: Props) {
  return (
    <Snackbar
      open={open}
      onClose={(_, reason) => {
        // Clear lastDeleted when snackbar closes
        if (reason === 'timeout' || reason === 'clickaway') {
          onClose();
        }
      }}
      autoHideDuration={4000}
      message="Task deleted"
      action={<Button color="secondary" size="small" onClick={onUndo}>Undo</Button>}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  );
}
```

**In `src/hooks/useTasks.ts`**, add a method to clear lastDeleted:
```typescript
const clearLastDeleted = useCallback(() => {
  setLastDeleted(null);
}, []);

// Return it in the hook
return { 
  tasks, loading, error, derivedSorted, metrics, 
  lastDeleted, addTask, updateTask, deleteTask, 
  undoDelete, clearLastDeleted 
};
```

**In `src/App.tsx`**, update the handler:
```typescript
const { ..., clearLastDeleted } = useTasksContext();

const handleCloseUndo = () => {
  clearLastDeleted();
};
```

---

## BUG 3: Unstable Sorting ✅

### Location
`src/utils/logic.ts` - Lines 29-40 (sortTasks function)

### Problem
When two tasks have the same ROI AND same priority, there's no deterministic tie-breaker. This causes:
- Random reordering on each render
- Flickering UI
- Inconsistent user experience

### Current Code
```typescript
export function sortTasks(tasks: ReadonlyArray<DerivedTask>): DerivedTask[] {
  return [...tasks].sort((a, b) => {
    const aROI = a.roi ?? -Infinity;
    const bROI = b.roi ?? -Infinity;
    if (bROI !== aROI) return bROI - aROI;
    if (b.priorityWeight !== a.priorityWeight) return b.priorityWeight - a.priorityWeight;
    // MISSING: No tie-breaker here!
    return 0; // This causes instability
  });
}
```

### Fix
Add alphabetical sorting by title as the final tie-breaker:

```typescript
export function sortTasks(tasks: ReadonlyArray<DerivedTask>): DerivedTask[] {
  return [...tasks].sort((a, b) => {
    // Primary: ROI (descending)
    const aROI = a.roi ?? -Infinity;
    const bROI = b.roi ?? -Infinity;
    if (bROI !== aROI) return bROI - aROI;
    
    // Secondary: Priority weight (descending)
    if (b.priorityWeight !== a.priorityWeight) {
      return b.priorityWeight - a.priorityWeight;
    }
    
    // Tertiary: Alphabetical by title (ascending) - STABLE TIE-BREAKER
    return a.title.localeCompare(b.title);
  });
}
```

---

## BUG 4: Double Dialog Opening ✅

### Location
`src/components/TaskTable.tsx` - Lines 30-37

### Problem
When clicking Edit or Delete buttons:
- The button's onClick fires
- Then the event bubbles up to the TableRow's onClick
- This opens BOTH dialogs simultaneously

### Current Code
```typescript
const handleEditClick = (e: React.MouseEvent, task: Task) => {
  // MISSING: e.stopPropagation()
  setEditing(task);
  setOpenForm(true);
};

const handleDeleteClick = (e: React.MouseEvent, id: string) => {
  // MISSING: e.stopPropagation()
  onDelete(id);
};
```

### Fix
Add `e.stopPropagation()` to prevent event bubbling:

```typescript
const handleEditClick = (e: React.MouseEvent, task: Task) => {
  e.stopPropagation(); // FIXED: Prevent row click
  setEditing(task);
  setOpenForm(true);
};

const handleDeleteClick = (e: React.MouseEvent, id: string) => {
  e.stopPropagation(); // FIXED: Prevent row click
  onDelete(id);
};
```

---

## BUG 5: ROI Errors ✅

### Location
`src/utils/logic.ts` - Lines 3-6 (computeROI function)

### Problem
The current ROI calculation doesn't handle edge cases:
- Division by zero when `timeTaken = 0`
- Invalid inputs (NaN, undefined, null)
- Results in "Infinity", "NaN", or crashes

### Current Code
```typescript
export function computeROI(revenue: number, timeTaken: number): number | null {
  // Injected bug: no validation for div-by-zero or invalid inputs
  return revenue / timeTaken; // Can return Infinity or NaN
}
```

### Fix
Add comprehensive validation:

```typescript
export function computeROI(revenue: number, timeTaken: number): number | null {
  // Validate inputs exist and are numbers
  if (typeof revenue !== 'number' || typeof timeTaken !== 'number') {
    return null;
  }
  
  // Handle invalid numbers (NaN, Infinity)
  if (!Number.isFinite(revenue) || !Number.isFinite(timeTaken)) {
    return null;
  }
  
  // Handle zero or negative time (division by zero)
  if (timeTaken <= 0) {
    return null;
  }
  
  const roi = revenue / timeTaken;
  
  // Ensure result is finite
  return Number.isFinite(roi) ? roi : null;
}
```

---

## Additional Issues Found

### Malformed Data in Seed
**Location:** `src/hooks/useTasks.ts` - Lines 47-53

**Problem:** Code intentionally injects malformed tasks:
```typescript
if (Math.random() < 0.5) {
  finalData = [
    ...finalData,
    { id: undefined, title: '', revenue: NaN, timeTaken: 0, ... } as any,
    { id: finalData[0]?.id ?? 'dup-1', ... timeTaken: -5, ... } as any,
  ];
}
```

**Fix:** Remove this entire block (lines 47-53)

---

## Summary of Changes

| Bug | File | Lines | Status |
|-----|------|-------|--------|
| BUG 1 | `src/hooks/useTasks.ts` | 77-91 | Remove entire useEffect |
| BUG 2 | `src/components/UndoSnackbar.tsx` | - | Update onClose handler |
| BUG 2 | `src/hooks/useTasks.ts` | - | Add clearLastDeleted method |
| BUG 2 | `src/App.tsx` | - | Call clearLastDeleted |
| BUG 3 | `src/utils/logic.ts` | 29-40 | Add title tie-breaker |
| BUG 4 | `src/components/TaskTable.tsx` | 30-37 | Add stopPropagation |
| BUG 5 | `src/utils/logic.ts` | 3-15 | Add validation |
| Extra | `src/hooks/useTasks.ts` | 47-53 | Remove malformed data injection |

---

## Testing Checklist

- [ ] Page loads data only once (check Network tab)
- [ ] Undo only works while snackbar is visible
- [ ] Tasks with same ROI/priority stay in consistent order
- [ ] Edit button opens only Edit dialog
- [ ] Delete button opens only Delete confirmation
- [ ] Click on row opens only View dialog
- [ ] ROI shows "N/A" for time = 0 (not "Infinity")
- [ ] No "NaN" values in ROI column
- [ ] Invalid inputs handled gracefully

---

## Deployment Notes

After implementing these fixes:
1. Run `npm run build` to create production build
2. Deploy to Vercel/Netlify
3. Test all functionality in production
4. Verify no console errors

Good luck! 🚀