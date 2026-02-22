import { getSalaryConfig } from "@/app/actions";
import { SalaryForm } from "@/components/settings/salary-form";

export default async function SalarySettingsPage() {
  const config = await getSalaryConfig();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Настройки зарплаты</h3>
        <p className="text-sm text-muted-foreground">
          Настройте параметры расчета заработной платы и аванса.
        </p>
      </div>
      <SalaryForm initialConfig={config} />
    </div>
  );
}
