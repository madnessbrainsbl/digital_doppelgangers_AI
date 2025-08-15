import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneCall,
  Settings,
  Upload,
  Clock,
  BarChart3,
  AlertTriangle,
  Zap,
  Mic,
  FileAudio,
  Users,
  Activity,
} from "lucide-react";

interface VoiceInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VoiceInstructionsDialog({
  open,
  onOpenChange,
}: VoiceInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Phone className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с голосовым модулем
          </DialogTitle>
          <DialogDescription>
            Полное руководство по настройке и использованию голосового модуля
            для автоматических звонков
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важное предупреждение */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex flex-col items-center">
                <div className="flex items-start justify-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                  <h4 className="text-center font-semibold text-amber-800 dark:text-amber-300">
                    Важное уведомление
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="mb-2">
                      Данные в этом модуле пока неактуальны.
                      <br />
                      Голосовой модуль находится в стадии активной разработки.
                      Вскоре этот модуль преобразится и получит множество новых
                      возможностей.
                    </p>
                    <p>
                      Инструкции тоже будут кардинально изменены в соответствии
                      с новым функционалом.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
