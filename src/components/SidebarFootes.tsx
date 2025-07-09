import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { FaSun, FaMoon } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import React from "react";

export interface SidebarFooterProps {
    user: any;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    logout: () => void;
    open: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ user, theme, setTheme, logout, open }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleThemeToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        logout();
    };

    if (!open) {
        return (
            <button className="flex w-full items-center justify-center rounded-lg px-2 py-2 bg-muted">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
            </button>
        );
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button 
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 hover:bg-accent cursor-pointer"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="font-semibold">{user?.name ?? 'User'}</span>
                            <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
                        </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
                align="end" 
                className="w-[200px]"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <DropdownMenuItem onClick={handleThemeToggle}>
                    {theme === 'dark' ? <FaSun className="mr-2 h-4 w-4" /> : <FaMoon className="mr-2 h-4 w-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                    <IoLogOutOutline className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SidebarFooter;