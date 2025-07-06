import { createTaskFormAction } from '@/app/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SortableTaskList } from '@/components/sortable-task-list'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-center mb-6">Todo App</h1>

          {/* Task Input Form */}
          <form action={createTaskFormAction} className="flex gap-2 mb-6">
            <Input
              name="title"
              placeholder="Add a new task..."
              className="flex-grow"
            />
            <Button type="submit">Add Task</Button>
          </form>

          {/* Task List */}
          <div className="space-y-3">
            <SortableTaskList />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



