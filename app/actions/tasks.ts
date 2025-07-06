'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './types';
import { Task } from '@prisma/client';

/**
 * Fetches all tasks from the database, ordered by their 'order' property.
 * This function is designed to be used with `useQuery`.
 * @returns A promise that resolves to an array of tasks.
 * @throws An error if the database query fails.
 */
export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        order: 'asc',
      },
    });
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Let the error boundary or useQuery's error state handle this
    throw new Error('Failed to fetch tasks.');
  }
}

/**
 * Updates the order of multiple tasks in a single database transaction.
 * @param newOrder An array of objects, each with a taskId and its new order.
 * @returns An ActionResult indicating success or failure.
 */
export async function updateTaskOrder(
  newOrder: { id: string; order: number }[]
): Promise<ActionResult<Task[]>> {
  try {
    const updatedTasks = await prisma.$transaction(
      newOrder.map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: { order: task.order },
        })
      )
    );

    revalidatePath('/');
    return { success: true, data: updatedTasks };
  } catch (error) {
    console.error('Failed to update task order:', error);
    return {
      success: false,
      error: 'Failed to update task order. Please try again.',
    };
  }
}


/**
 * Creates a new task from form data. This is a server action for forms.
 * @param formData The form data from the client.
 * @returns An object with an error message if validation fails.
 */
export async function createTaskFormAction(formData: FormData) {
  const title = formData.get('title') as string;

  if (!title || title.trim().length === 0) {
    return { error: 'Title is required.' };
  }

  try {
    await createTask(title);
    revalidatePath('/');
  } catch (error) {
    return { error: 'Failed to create task.' };
  }
}

/**
 * Creates a new task.
 * @param title The title of the task.
 * @returns An ActionResult indicating success or failure.
 */
export async function createTask(title: string): Promise<ActionResult<Task>> {
  try {
    const lastTask = await prisma.task.findFirst({
      orderBy: { order: 'desc' },
    });

    const newOrder = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        order: newOrder,
      },
    });
    return { success: true, data: task };
  } catch (error) {
    console.error('Failed to create task:', error);
    return { success: false, error: 'Failed to create task.' };
  }
}

