export type NavIcon =
  | "layout-dashboard"
  | "users"
  | "user-circle"
  | "bar-chart"
  | "kanban"
  | "briefcase"
  | "check-square"
  | "settings";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIcon;
};

export const mainNavigation: NavItem[] = [
  { title: "Дашборд", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Клиенты", href: "/clients", icon: "user-circle" },
  { title: "Сделки", href: "/deals", icon: "briefcase" },
  { title: "Задачи", href: "/tasks", icon: "check-square" },
  { title: "Лиды", href: "/leads", icon: "users" },
  { title: "Воронка", href: "/pipeline", icon: "kanban" },
  { title: "Аналитика", href: "/analytics", icon: "bar-chart" },
  { title: "Настройки", href: "/settings", icon: "settings" },
];
