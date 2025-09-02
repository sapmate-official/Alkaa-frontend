import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface TaskUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  updatedBy: {
    firstName: string;
    lastName: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  assignments: Array<{
    assignedTo: User;
  }>;
  updates: TaskUpdate[];
}

interface TaskChatViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated?: (updatedTask: Task) => void;
}

const TaskChatView = ({ open, onOpenChange, task }: TaskChatViewProps) => {

  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);

  useEffect(() => {
    if (task) {
      setUpdates(task.updates || []);
    }
  }, [task]);

  const submitMessage = async () => {
    if (!task || !newMessage.trim()) return;

    const messageText = newMessage.trim();

    try {
      setIsSubmitting(true);
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      const response = await axios.post(APIDictionary.taskUpdate(task.id), {
        message: messageText
      }, { withCredentials: true });

      // Handle successful response
      if (response.data.success && response.data.data) {
        const serverUpdate = response.data.data;
        
        // Add the new update to the local state
        setUpdates(prev => [serverUpdate, ...prev]);

        toast({
          title: "Success",
          description: "Message sent successfully"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Restore the message on error
      setNewMessage(messageText);
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' as const },
      COMPLETED: { label: 'Completed', variant: 'default' as const },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' as const }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Low', variant: 'secondary' as const },
      MEDIUM: { label: 'Medium', variant: 'default' as const },
      HIGH: { label: 'High', variant: 'destructive' as const },
      URGENT: { label: 'Urgent', variant: 'destructive' as const }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || priority}</Badge>;
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="space-y-2">
            <DialogTitle className="text-lg">{task.title}</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            <p className="text-sm text-muted-foreground">
              {task.description}
            </p>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {updates.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {update.updatedBy.firstName[0]}{update.updatedBy.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {update.updatedBy.firstName} {update.updatedBy.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{update.message}</p>
                    {update.status && (
                      <div className="mt-2">
                        {getStatusBadge(update.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t pt-4">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
              className="flex-1"
            />
            <Button 
              onClick={submitMessage}
              disabled={!newMessage.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskChatView;
