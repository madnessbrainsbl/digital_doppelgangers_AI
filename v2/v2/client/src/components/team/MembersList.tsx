import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MembersListProps {
  members: User[];
  onEdit: (user: User) => void;
}

export default function MembersList({ members, onEdit }: MembersListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Пользователь успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить пользователя: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Администратор</Badge>;
      case "editor":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Редактор</Badge>;
      case "operator":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Оператор</Badge>;
      case "viewer":
        return <Badge className="bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">Просмотр</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getUserColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "editor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "operator":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "viewer":
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300";
      default:
        return "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300";
    }
  };

  const getFormattedRole = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return "Администратор";
      case "editor":
        return "Редактор";
      case "operator":
        return "Оператор";
      case "viewer":
        return "Просмотр";
      default:
        return role;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Команда</CardTitle>
          <div className="relative max-w-md w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сотрудник</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className={getUserColor(member.role)}>
                          {getUserInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">@{member.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <span className="material-icons text-muted-foreground">more_vert</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingUser(member)}>
                          <span className="material-icons text-sm mr-2">visibility</span>
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(member)}>
                          <span className="material-icons text-sm mr-2">edit</span>
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => deleteUserMutation.mutate(member.id)}
                        >
                          <span className="material-icons text-sm mr-2">delete</span>
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Не найдено сотрудников
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
          {viewingUser && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Информация о сотруднике</DialogTitle>
                <DialogDescription>Детальная информация о пользователе</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarFallback className={getUserColor(viewingUser.role)} style={{ fontSize: '1.25rem' }}>
                      {getUserInitials(viewingUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">{viewingUser.name}</h3>
                  <div className="mt-1">{getRoleBadge(viewingUser.role)}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Имя пользователя:</span>
                    <span className="font-medium">@{viewingUser.username}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{viewingUser.email}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Роль:</span>
                    <span className="font-medium">{getFormattedRole(viewingUser.role)}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{viewingUser.id}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setViewingUser(null)}>
                    Закрыть
                  </Button>
                  <Button onClick={() => {
                    onEdit(viewingUser);
                    setViewingUser(null);
                  }}>
                    Редактировать
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
