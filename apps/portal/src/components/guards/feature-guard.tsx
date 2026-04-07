import { ReactNode } from "react";
import {
  getCurrentUserPlanFromDatabase,
  hasRequiredPlan,
  type PlanTier,
} from "@/lib/plans";
import { PLANS } from "@/constants/plans";

type FeatureGuardProps = {
  requiredPlan?: PlanTier;
  freePlanRequired?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  plan?: PlanTier;
};

export function FeatureGuard({
  requiredPlan,
  freePlanRequired = false,
  children,
  fallback = null,
  plan,
}: FeatureGuardProps) {
  if (plan === undefined) return <>{fallback}</>;

  const userPlan = plan ?? getCurrentUserPlanFromDatabase();

  if (freePlanRequired && userPlan !== PLANS.FREE) {
    return <>{fallback}</>;
  }

  if (requiredPlan && !hasRequiredPlan(userPlan, requiredPlan)) {
    return <>{fallback}</>;
  }


  return <>{children}</>;
}

export default FeatureGuard;
