'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, updateTaskOrder } from '@/app/actions/tasks';
import { TaskItem } from './task-item';
import { Task } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionResult } from '@/app/actions/types';

export function SortableTaskList() {
  const queryClient = useQueryClient();

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  });

  const { mutate: reorderTasks } = useMutation<
    ActionResult<Task[]>,
    Error,
    Task[],
    { previousTasks?: Task[] }
  >({
    mutationFn: (reorderedTasks: Task[]) => {
        const taskOrder = reorderedTasks.map((task, index) => ({
          id: task.id,
          order: index,
        }));
        return updateTaskOrder(taskOrder);
    },
    onMutate: async (reorderedTasks: Task[]) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData(['tasks'], reorderedTasks);
      return { previousTasks };
    },
    onError: (err, newOrder, context) => {
      console.error('Failed to reorder tasks:', err);
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks?.findIndex((task) => task.id === active.id);
      const newIndex = tasks?.findIndex((task) => task.id === over.id);

      if (tasks && oldIndex !== undefined && newIndex !== undefined && oldIndex !== -1 && newIndex !== -1) {
        const newTasksArray = arrayMove(tasks, oldIndex, newIndex);
        reorderTasks(newTasksArray);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 p-4 border border-red-500/50 bg-red-500/10 rounded-md">
        <p>
          <strong>Error:</strong> {error.message}
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks?.map((task) => task.id) || []}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks?.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}



