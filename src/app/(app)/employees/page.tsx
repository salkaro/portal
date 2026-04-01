import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { EmployeesContent } from "../../../components/app/employees/employees-content";

export const metadata = pageMetadata(
  "Employees",
  "Manage employee access and permissions for your Salkaro Portal account.",
);

export default function EmployeesPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free">
        <EmployeesContent />
      </PageGuard>
    </div>
  );
}
