import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { USER_ROLES } from "@/lib/constants";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  plan?: string;
  referrerId?: number | null;
  managerId?: number | null;
  totalSpent?: number | null;
  registeredAt?: string;
}

interface TeamMemberCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TeamMemberCard({ user, onEdit, onDelete }: TeamMemberCardProps) {
  const getRoleName = (roleId: string) => {
    const role = USER_ROLES.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Generate color based on user id for visual distinction
  const getColorClass = (id: number) => {
    const colors = [
      "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300",
      "bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300",
      "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
      "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
      "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    ];
    return colors[id % colors.length];
  };

  return (
    <Card className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full ${getColorClass(user.id)} flex items-center justify-center text-xl font-semibold mb-3`}>
          {getInitials(user.fullName)}
        </div>
        
        <h3 className="font-medium text-neutral-900 dark:text-white mb-1">{user.fullName}</h3>
        
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300 mb-1">
          {getRoleName(user.role)}
        </span>
        
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{user.email}</p>
        
        {user.plan && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mb-1">
            План: {user.plan}
          </span>
        )}
        
        {user.totalSpent !== undefined && user.totalSpent !== null && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
            Сумма покупок: {user.totalSpent.toLocaleString()} ₽
          </p>
        )}
        
        {user.registeredAt && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Дата регистрации: {new Date(user.registeredAt).toLocaleDateString()}
          </p>
        )}
        
        <div className="mt-auto pt-2 flex items-center justify-center space-x-2 w-full">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <span className="material-icons text-[18px]">edit</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="material-icons text-[18px]">more_vert</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <span className="material-icons text-[18px] mr-2">edit</span>
                <span>Редактировать</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400"
                onClick={onDelete}
              >
                <span className="material-icons text-[18px] mr-2">delete</span>
                <span>Удалить</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
