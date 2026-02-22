import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Budget Core
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80">
              Дашборд
            </Link>
            <Link href="/transactions" className="transition-colors hover:text-foreground/80">
              Транзакции
            </Link>
            <Link href="/planning" className="transition-colors hover:text-foreground/80">
              Планирование
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/salary">
            <Button variant="outline" size="sm">
              Настройки
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
