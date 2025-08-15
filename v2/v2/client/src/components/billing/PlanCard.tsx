import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanProps {
  name: string;
  price: number;
  period: "month" | "year";
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export default function PlanCard({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  current = false,
  disabled = false,
  onSelect,
}: PlanProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSelect = () => {
    if (current) return;
    setConfirmDialogOpen(true);
  };

  const confirmSelection = () => {
    setConfirmDialogOpen(false);
    onSelect();
  };

  return (
    <>
      <Card className={cn(
        "transition-all relative",
        popular && "border-primary-500 dark:border-primary-400 shadow-md",
        disabled && "opacity-70"
      )}>
        {popular && (
          <div className="absolute -top-3 left-0 right-0 flex justify-center">
            <Badge className="bg-primary-500 hover:bg-primary-500 dark:bg-primary-600 dark:hover:bg-primary-600">
              Популярный выбор
            </Badge>
          </div>
        )}
        {current && (
          <div className="absolute -top-3 left-0 right-0 flex justify-center">
            <Badge className="bg-green-500 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-600">
              Текущий план
            </Badge>
          </div>
        )}
        
        <CardHeader className={popular ? "pt-6" : ""}>
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-baseline mb-4">
            <span className="text-3xl font-bold">{price} ₽</span>
            <span className="text-neutral-500 dark:text-neutral-400 ml-1">
              /{period === "month" ? "мес" : "год"}
            </span>
          </div>
          
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                {feature.included ? (
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 text-neutral-300 dark:text-neutral-700" />
                )}
                <span className={cn(
                  "text-sm",
                  !feature.included && "text-neutral-500 dark:text-neutral-400"
                )}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSelect}
            disabled={disabled || current}
            variant={popular ? "default" : "outline"}
          >
            {current ? "Текущий план" : "Выбрать план"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение выбора плана</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите перейти на план "{name}" за {price} ₽/{period === "month" ? "мес" : "год"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={confirmSelection}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
