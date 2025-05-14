
'use client';

import type { GlobalEvent, GlobalEventOption } from '@/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InteractiveEventModalProps {
  event: GlobalEvent | null;
  isOpen: boolean;
  onClose: () => void; // Not strictly needed if AlertDialog handles its own open state via `open` prop
  onOptionSelect: (event: GlobalEvent, optionId: string) => void;
}

export function InteractiveEventModal({
  event,
  isOpen,
  onClose,
  onOptionSelect,
}: InteractiveEventModalProps) {
  if (!event || !event.options) {
    return null;
  }

  const handleOptionClick = (optionId: string) => {
    onOptionSelect(event, optionId);
    // AlertDialog will close itself if `isOpen` becomes false due to state change in parent
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{event.name}</AlertDialogTitle>
          <AlertDialogDescription className="max-h-[100px] overflow-y-auto">
            {event.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="max-h-[300px] my-4 pr-2">
          <div className="space-y-3">
            {event.options.map((option) => (
              <div key={option.id} className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                <h4 className="font-semibold text-sm mb-1">{option.text}</h4>
                <p className="text-xs text-muted-foreground mb-2">{option.description}</p>
                <Button
                  onClick={() => handleOptionClick(option.id)}
                  className="w-full text-xs"
                  size="sm"
                >
                  Choose: {option.text.length > 20 ? option.text.substring(0, 17) + "..." : option.text}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <AlertDialogFooter>
          {/* No explicit cancel or action buttons in footer as choices are primary actions */}
          {/* onClose is typically handled by AlertDialog's overlay click or Esc key */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
