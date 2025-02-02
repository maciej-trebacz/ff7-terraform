import { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedCell {
  row: number;
  column: number;
}

interface GridSelectionContextType {
  selectedCell: SelectedCell | null;
  selectCell: (row: number, column: number) => void;
  resetSelection: () => void;
}

const GridSelectionContext = createContext<GridSelectionContextType | null>(null);

export function GridSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const selectCell = (row: number, column: number) => {
    console.debug(`[GridSelectionContext] Selecting cell at ${row}, ${column}`);
    setSelectedCell({ row, column });
  };

  const resetSelection = () => {
    setSelectedCell(null);
  };

  return (
    <GridSelectionContext.Provider value={{ selectedCell, selectCell, resetSelection }}>
      {children}
    </GridSelectionContext.Provider>
  );
}

export function useGridSelection() {
  const context = useContext(GridSelectionContext);
  if (!context) {
    throw new Error('useGridSelection must be used within a GridSelectionProvider');
  }
  return context;
}
