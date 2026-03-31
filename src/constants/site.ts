import { AppWindowIcon, BellIcon, ChartPieIcon, SettingsIcon, StoreIcon, UserRoundKeyIcon, UsersRoundIcon } from "lucide-react";
import { ROUTES } from "./routes";

export const isProduction = process.env.NODE_ENV === "production";
export const ROOT_URL = isProduction ? process.env.NEXT_PUBLIC_APP_URL : "http://localhost:3000";

export const NAV_ITEMS = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: ChartPieIcon },
    { label: "Portals", href: ROUTES.PORTALS, icon: AppWindowIcon },
    { label: "Clients", href: ROUTES.CLIENTS, icon: UsersRoundIcon },
    { label: "Activity", href: ROUTES.ACTIVITY, icon: BellIcon },
];

export const NAV_INTERNAL_ITEMS = [
    { label: "Employees", href: ROUTES.EMPLOYEES, icon: UserRoundKeyIcon },
    { label: "Integrations", href: ROUTES.INTEGRATIONS, icon: StoreIcon },
];

export const NAV_FOOTER_ITEMS = [
    { label: "Settings", href: ROUTES.SETTINGS, icon: SettingsIcon },
];