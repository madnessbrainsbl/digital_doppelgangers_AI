import { Button } from "../ui/button";
import { useDisconnectNumber } from "@/hooks/telephony/use-disconnetc-number";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useState } from "react";

export function ButtonDisconnect({
  userId,
  phoneNumberDisconnect,
}: {
  userId: number;
  phoneNumberDisconnect: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const { mutate: disconnectNumber, isPending } = useDisconnectNumber({
    userId,
  });

  // Обработчик отключения номера
  const handleDisconnect = async (phoneNumber: string) => {
    disconnectNumber(phoneNumber);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          Отключить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отключение номера</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Вы уверены, что хотите отключить номер{" "}
          <strong>{phoneNumberDisconnect}</strong>?
        </DialogDescription>
        <div className="text-sm text-gray-700 font-semibold">
          <span className="text-red-500">
            Номер нельзя будит восстановить.{" "}
          </span>
          Это окончательное удаление номер и вы не сможете его использовать в
          будущем. Соответственно получение истории звонков и смс по этому
          номеру будет невозможно.
        </div>
        <div className="text-sm text-gray-700 font-semibold">
          Списанные средства не возвращаются!
        </div>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Подтвердите отключение"
        />
        <DialogFooter>
          <Button
            onClick={() => handleDisconnect(phoneNumberDisconnect)}
            className="w-full"
            variant="destructive"
            disabled={confirmText !== "Delete"}
          >
            {isPending ? "Отключение..." : "Отключить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
