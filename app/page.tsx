import { getTasks, createTask, updateTask, deleteTask } from '@/app/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default async function Home() {
  const { tasks, success } = await getTasks()

  if (!success || !tasks) {
    return <div className="text-center py-10">Failed to load tasks.</div>
  }

  const activeTasks = tasks.filter(task => !task.completed).length
  const completedTasks = tasks.filter(task => task.completed).length

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-center mb-6">Todo App</h1>

          {/* Task Input Form */}
          <form action={async (formData: FormData) => {
            'use server'
            const title = formData.get('title') as string
            if (title.trim()) {
              await createTask(title)
            }
          }} className="flex gap-2 mb-6">
            <Input
              name="title"
              placeholder="Add a new task..."
              className="flex-grow"
            />
            <Button type="submit">Add Task</Button>
          </form>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground">No tasks yet. Add one above!</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-card rounded-md shadow-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <form action={async () => {
                      'use server'
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
                    'use server'
                    await deleteTask(task.id)
                  }}>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>

          {/* Task Counters */}
          <div className="mt-6 text-sm text-muted-foreground flex justify-between">
            <span>Active: {activeTasks}</span>
            <span>Completed: {completedTasks}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

