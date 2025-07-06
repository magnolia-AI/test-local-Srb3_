'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Task } from '@prisma/client'

export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        order: 'asc',
      },
    })
    return { success: true, tasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
}

export async function createTask(title: string) {
  try {
    const latestTask = await prisma.task.findFirst({
      orderBy: {
        order: 'desc',
      },
    })

    const newOrder = latestTask ? latestTask.order + 1 : 0

    const task = await prisma.task.create({
      data: {
        title,
        order: newOrder,
      },
    })
    revalidatePath('/')
    return { success: true, task }
  } catch (error) {
    console.error('Error creating task:', error)
    return { success: false, error: 'Failed to create task' }
  }
}

export async function createTaskFromForm(formData: FormData) {
  const title = formData.get('title') as string
  
  if (!title || !title.trim()) {
    return { success: false, error: 'Title is required' }
  }
  
  return await createTask(title.trim())
}

export async function updateTask(id: string, data: Partial<Task>) {
  try {
    const task = await prisma.task.update({
      where: { id },
      data,
    })
    revalidatePath('/')
    return { success: true, task }
  } catch (error) {
    console.error('Error updating task:', error)
    return { success: false, error: 'Failed to update task' }
  }
}

export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {

export async function updateTaskOrder(
  tasks: { id: string; order: number }[]
) {
  try {
    await prisma.$transaction(
      tasks.map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: { order: task.order },
        })
      )
    );
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating task order:', error);
    return { success: false, error: 'Failed to update task order' };
  }
}


export async function updateTaskOrder(tasks: { id: string; order: number }[]) {
  try {
    await prisma.$transaction(
      tasks.map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: { order: task.order },
        })
      )
    );
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating task order:', error);
    return { success: false, error: 'Failed to update task order' };
  }
}

    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

export async function updateTaskOrder(tasks: { id: string; order: number }[]) {
  try {
    const transaction = tasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: { order: task.order },
      })
    )
    await prisma.$transaction(transaction)
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error updating task order:', error)
    return { success: false, error: 'Failed to update task order' }
  }
}

