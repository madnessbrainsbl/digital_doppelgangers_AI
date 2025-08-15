import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Trash2 } from "lucide-react";

export function DialogDelete({
  onDelete,
  id,
  title,
  description,
  deletedSuccess,
  assistants,
}: {
  onDelete: (id: number) => void;
  id: number;
  title: string;
  description: string;
  deletedSuccess: boolean;
  assistants: { id: number; name: string; role: string }[] | undefined;
}) {
  const [openDelete, setOpenDelete] = useState<boolean>(false);

  return (
    <Dialog open={openDelete} onOpenChange={setOpenDelete}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {deletedSuccess
            ? "Удаление запрещено. Есть подключение у ассистентов."
            : `${description} Это действие необратимо.`}
        </DialogDescription>
        {deletedSuccess && (
          <div>
            <hr className="my-2" />
            <p>Ассистенты, использующие функцию:</p>
            <ul className="list-disc pl-5">
              {assistants &&
                assistants.map((assistant) => (
                  <li key={assistant.id}>{assistant.name}</li>
                ))}
            </ul>
          </div>
        )}
        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setOpenDelete(false)}>
            Отменить
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(id)}
            disabled={deletedSuccess}
          >
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
