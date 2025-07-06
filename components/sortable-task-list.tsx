'use client';

import React from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { Task } from '@prisma/client';
import { TaskItem } from './task-item';
import { getTasks, updateTaskOrder } from '@/app/actions/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function SortableTaskList() {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  });

  const { mutate: updateOrderMutation } = useMutation({
    mutationFn: updateTaskOrder,
    onMutate: async (newOrder: { id: string; order: number }[]) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      const optimisticTasks = newOrder.map(taskUpdate => {
        const existingTask = previousTasks?.find(t => t.id === taskUpdate.id);
        return { ...existingTask!, order: taskUpdate.order };
      }).sort((a, b) => a.order - b.order);

      queryClient.setQueryData(['tasks'], optimisticTasks);
      return { previousTasks };
    },
    onError: (err, newOrder, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks?.findIndex((item) => item.id === active.id);
      const newIndex = tasks?.findIndex((item) => item.id === over.id);

      if (tasks && oldIndex !== undefined && newIndex !== undefined && oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(tasks, oldIndex, newIndex);
        const updatedTaskOrder = newOrder.map((task, index) => ({
          id: task.id,
          order: index,
        }));
        updateOrderMutation(updatedTaskOrder);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading tasks.</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks || []} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {(tasks || []).map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

