'use client';

import { Transaction, Category } from '@prisma/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteTransaction } from '@/app/actions';
import { toast } from 'sonner';

interface TransactionItemProps {
  transaction: Transaction & { category: Category | null };
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  async function handleDelete() {
    try {
      await deleteTransaction(transaction.id);
      toast.success('Транзакция удалена');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  }

  return (
    <div className="flex items-center group">
      <div className="ml-4 space-y-1 flex-1">
        <p className="text-sm font-medium leading-none">{transaction.description}</p>
        <p className="text-sm text-muted-foreground">
          {transaction.category?.name} • {format(transaction.date, 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>
      <div className={`mr-4 font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
        {transaction.type === 'INCOME' ? '+' : '-'}{transaction.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
