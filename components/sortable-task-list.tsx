'use client';

import React, { useState } from 'react';
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
import { updateTaskOrder } from '@/app/actions/tasks';

interface SortableTaskListProps {
  tasks: Task[];
}

export function SortableTaskList({ tasks: initialTasks }: SortableTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const originalTasks = [...tasks];
      const oldIndex = tasks.findIndex((item) => item.id === active.id);
      const newIndex = tasks.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      
      // Optimistic UI update
      setTasks(newOrder);

      const updatedTaskOrder = newOrder.map((task, index) => ({
        id: task.id,
        order: index,
      }));

      try {
        // Call server action to update the database
        await updateTaskOrder(updatedTaskOrder);
      } catch (error) {
        // If the server action fails, revert the UI change
        console.error("Failed to update task order:", error);
        setTasks(originalTasks);
        // Optionally, show an error message to the user
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

