'use client';

import { useState } from 'react';
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
import { SortableTaskItem } from './sortable-task-item';
import { Task } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

export function SortableTaskList() {
  const queryClient = useQueryClient();

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  });

  const { mutate: reorderTasks } = useMutation({
    mutationFn: updateTaskOrder,
    onMutate: async (newOrder: { id: string; order: number }[]) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update to the new value
      // Create a map for quick lookups
      const newOrderMap = new Map(newOrder.map((t) => [t.id, t.order]));
      const optimisticallyUpdatedTasks =
        previousTasks?.map((task) => ({
          ...task,
          order: newOrderMap.get(task.id) ?? task.order,
        }))
        .sort((a, b) => a.order - b.order) || [];
      
      queryClient.setQueryData(['tasks'], optimisticallyUpdatedTasks);

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newOrder, context) => {
      console.error('Failed to reorder tasks:', err);
      // We can now access the specific error message from our action
      // and potentially display it in a toast notification.
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },
    // Always refetch after error or success:
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

      if (tasks && oldIndex !== undefined && newIndex !== undefined) {
        const newTasksArray = arrayMove(tasks, oldIndex, newIndex);
        
        // Create the payload for the server action
        const newOrder = newTasksArray.map((task, index) => ({
          id: task.id,
          order: index,
        }));

        reorderTasks(newOrder);
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
      <SortableContext items={tasks || []} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks?.map((task) => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

