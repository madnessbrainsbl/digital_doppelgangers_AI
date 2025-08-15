import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";

interface VideoDialogProps {
  buttonText: string;
  dialogTitle: string;
  videoUrl: string;
  description?: string;
  buttonClassName?: string;
}

export function VideoDialog({
  buttonText,
  dialogTitle,
  videoUrl,
  description,
  buttonClassName = "flex items-center gap-2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors",
}: VideoDialogProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button onClick={() => setShowDialog(true)} className={buttonClassName}>
        <Play size={14} />
        <span className="text-sm font-medium">{buttonText}</span>
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl p-0 bg-white">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={videoUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="clipboard-write; autoplay"
                  allowFullScreen
                  className="w-full h-full"
                  title={dialogTitle}
                />
              </div>
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                {description}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
