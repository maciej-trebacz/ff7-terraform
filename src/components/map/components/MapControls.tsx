import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RotateCcw, RotateCw, Home } from 'lucide-react';

interface MapControlsProps {
  onRotate: (direction: 'left' | 'right') => void;
  onReset: () => void;
}

export function MapControls({ onRotate, onReset }: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-10">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/50 backdrop-blur-sm"
              onClick={onReset}
            >
              <Home className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset view</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/50 backdrop-blur-sm"
              onClick={() => onRotate('left')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rotate map left</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/50 backdrop-blur-sm"
              onClick={() => onRotate('right')}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rotate map right</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 