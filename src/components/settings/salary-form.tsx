'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { SalaryConfig } from '@prisma/client';
import { saveSalaryConfig, generateSalaryTransactions } from '@/app/actions';
import { useState } from 'react';
import { calculateSalary, SalaryPayment } from '@/lib/salary-calculator';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  type: z.enum(['FIXED', 'HOURLY']),
  baseAmount: z.coerce.number().min(1, 'Сумма должна быть больше 0'),
  advanceDay: z.coerce.number().min(1).max(31),
  salaryDay: z.coerce.number().min(1).max(31),
  advancePercent: z.coerce.number().min(0).max(100).optional(),
  workingHours: z.coerce.number().min(1).max(24).optional(),
});

interface SalaryFormProps {
  initialConfig?: SalaryConfig | null;
}

export function SalaryForm({ initialConfig }: SalaryFormProps) {
  const [preview, setPreview] = useState<SalaryPayment[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: (initialConfig?.type as 'FIXED' | 'HOURLY') || 'FIXED',
      baseAmount: initialConfig?.baseAmount || 50000,
      advanceDay: initialConfig?.advanceDay || 25,
      salaryDay: initialConfig?.salaryDay || 10,
      advancePercent: initialConfig?.advancePercent || 40,
      workingHours: initialConfig?.workingHours || 8,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await saveSalaryConfig(values);
      toast.success('Настройки зарплаты сохранены');
      updatePreview(values);
    } catch (error) {
      toast.error('Ошибка при сохранении');
      console.error(error);
    }
  }

  function updatePreview(values: z.infer<typeof formSchema>) {
    const today = new Date();
    // Calculate for current and next month
    const currentMonth = calculateSalary(today.getFullYear(), today.getMonth(), values);
    const nextMonth = calculateSalary(
      today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear(),
      today.getMonth() === 11 ? 0 : today.getMonth() + 1,
      values
    );
    setPreview([...currentMonth, ...nextMonth]);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип оплаты</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">Оклад</SelectItem>
                        <SelectItem value="HOURLY">Почасовая</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('type') === 'FIXED' ? 'Оклад (мес)' : 'Ставка (час)'}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="advanceDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>День аванса</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>День зарплаты</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Обычно в следующем месяце</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.watch('type') === 'FIXED' && (
                <FormField
                  control={form.control}
                  name="advancePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Процент аванса (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch('type') === 'HOURLY' && (
                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Часов в день</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex gap-2">
                <Button type="submit">Сохранить</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updatePreview(form.getValues())}
                >
                  Рассчитать пример
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Предварительный расчет</CardTitle>
          {preview.length > 0 && (
            <Button onClick={onGenerate} size="sm">
              Сгенерировать
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preview.length === 0 ? (
              <p className="text-muted-foreground">
                Нажмите "Рассчитать пример" чтобы увидеть прогноз выплат.
              </p>
            ) : (
              preview.map((p, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">
                      {p.type === 'ADVANCE' ? 'Аванс' : 'Зарплата'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(p.date, 'd MMMM yyyy', { locale: ru })}
                    </div>
                  </div>
                  <div className="font-bold text-green-600">
                    +{p.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
