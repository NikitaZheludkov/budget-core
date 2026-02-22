'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Transaction, Category, SalaryConfig } from '@prisma/client';

export async function seedCategories() {
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'Зарплата', type: 'INCOME', color: 'green' },
        { name: 'Аванс', type: 'INCOME', color: 'green' },
        { name: 'Продукты', type: 'EXPENSE', color: 'orange' },
        { name: 'Квартира', type: 'EXPENSE', color: 'blue' },
        { name: 'Транспорт', type: 'EXPENSE', color: 'gray' },
        { name: 'Развлечения', type: 'EXPENSE', color: 'purple' },
        { name: 'Здоровье', type: 'EXPENSE', color: 'red' },
      ],
    });
  }
}

export async function getCategories() {
  await seedCategories();
  return prisma.category.findMany();
}

export async function getTransactions(month?: Date) {
  // If month is provided, filter by that month
  // For now, let's just return all
  return prisma.transaction.findMany({
    orderBy: { date: 'asc' },
    include: { category: true },
  });
}

export async function createTransaction(data: {
  amount: number;
  date: Date;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  status: 'PLANNED' | 'COMPLETED';
}) {
  const t = await prisma.transaction.create({
    data,
  });
  revalidatePath('/');
  return t;
}

export async function getSalaryConfig() {
  return prisma.salaryConfig.findFirst();
}

export async function saveSalaryConfig(data: any) {
  const existing = await prisma.salaryConfig.findFirst();
  if (existing) {
    await prisma.salaryConfig.update({
      where: { id: existing.id },
      data: {
        type: data.type,
        baseAmount: Number(data.baseAmount),
        advanceDay: Number(data.advanceDay),
        salaryDay: Number(data.salaryDay),
        advancePercent: data.advancePercent ? Number(data.advancePercent) : null,
        workingHours: data.workingHours ? Number(data.workingHours) : null,
      },
    });
  } else {
    await prisma.salaryConfig.create({
      data: {
        type: data.type,
        baseAmount: Number(data.baseAmount),
        advanceDay: Number(data.advanceDay),
        salaryDay: Number(data.salaryDay),
        advancePercent: data.advancePercent ? Number(data.advancePercent) : null,
        workingHours: data.workingHours ? Number(data.workingHours) : null,
      },
    });
  }
  revalidatePath('/');
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath('/');
}

export async function generateSalaryTransactions(payments: { date: Date; amount: number; type: 'ADVANCE' | 'SALARY' }[]) {
  // Find or create categories
  let advanceCategory = await prisma.category.findFirst({ where: { name: 'Аванс' } });
  if (!advanceCategory) {
    advanceCategory = await prisma.category.create({ data: { name: 'Аванс', type: 'INCOME', color: 'green' } });
  }

  let salaryCategory = await prisma.category.findFirst({ where: { name: 'Зарплата' } });
  if (!salaryCategory) {
    salaryCategory = await prisma.category.create({ data: { name: 'Зарплата', type: 'INCOME', color: 'green' } });
  }

  const transactions = [];
  for (const p of payments) {
    const categoryId = p.type === 'ADVANCE' ? advanceCategory.id : salaryCategory.id;
    const description = p.type === 'ADVANCE' ? 'Аванс' : 'Зарплата';
    
    // Check if exists
    const exists = await prisma.transaction.findFirst({
      where: {
        date: p.date,
        amount: p.amount,
        categoryId,
      }
    });

    if (!exists) {
      transactions.push(prisma.transaction.create({
        data: {
          amount: p.amount,
          date: p.date,
          description,
          type: 'INCOME',
          status: 'PLANNED',
          categoryId,
        }
      }));
    }
  }

  await prisma.$transaction(transactions);
  revalidatePath('/');
}
