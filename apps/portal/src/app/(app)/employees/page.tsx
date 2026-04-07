import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { EmployeesContent } from "../../../components/app/employees/employees-content";
import { EmployeesSkeleton } from "@/components/app/employees/employees-skeleton";

export const metadata = pageMetadata(
  "Employees",
  "Manage employee access and permissions for your Salkaro Portal account.",
);

export default function EmployeesPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<EmployeesSkeleton />}>
        <EmployeesContent />
      </PageGuard>
    </div>
  );
}
