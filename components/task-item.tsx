'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Task } from '@prisma/client'
import { updateTask, deleteTask } from '@/app/actions/tasks'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      key={task.id}
      className="flex items-center justify-between p-3 bg-card rounded-md shadow-sm hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <form action={async () => {
          await updateTask(task.id, { completed: !task.completed })
        }}>
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => { /* Form action handles this */ }}
          />
        </form>
        <Label
          htmlFor={`task-${task.id}`}
          className={cn(
            "text-lg",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </Label>
      </div>
      <form action={async () => {
        await deleteTask(task.id)
      }}>
        <Button variant="destructive" size="sm">Delete</Button>
      </form>
    </div>
  )
}

