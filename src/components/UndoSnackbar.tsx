import { Snackbar, Button } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onUndo: () => void;
}

// BUG FIX 2: Properly handle snackbar close to clear lastDeleted
export default function UndoSnackbar({ open, onClose, onUndo }: Props) {
  return (
    <Snackbar
      open={open}
      onClose={(_, reason) => {
        // Clear lastDeleted when snackbar closes (timeout or clickaway)
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