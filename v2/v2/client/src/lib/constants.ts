export const APP_NAME = "Asisto";

export const MAIN_NAV_ITEMS = [
  { icon: "dashboard", label: "Дашборд", href: "/" },
  { icon: "analytics", label: "Аналитика", href: "/analytics" },
  { icon: "smart_toy", label: "Ассистенты", href: "/assistants" },
  { icon: "menu_book", label: "База знаний", href: "/knowledge-base" },
  { icon: "forum", label: "Коммуникации", href: "/communications" },
  { icon: "podcasts", label: "Каналы", href: "/channels" },
  { icon: "phone", label: "Телефония", href: "/voice" },
  { icon: "notifications", label: "Уведомления", href: "/notifications" },
  { icon: "people", label: "Команда", href: "/team" },
  { icon: "share", label: "Рефералы", href: "/referrals" },
  { icon: "account_balance", label: "Оплата", href: "/billing" },
];

export const USER_ROLES = [
  { id: "admin", name: "Администратор" },
  { id: "manager", name: "Менеджер" },
  { id: "referral", name: "Реферал" },
  { id: "user", name: "Клиент" },
];

export const CHANNEL_TYPES = [
  { id: "web", name: "Веб-сайт", allowMultiple: true },
  { id: "telegram", name: "Telegram", allowMultiple: true },
  { id: "vk", name: "ВКонтакте", allowMultiple: true },
  { id: "avito", name: "Авито", allowMultiple: true },
  { id: "email", name: "Email", allowMultiple: true },
  { id: "sms", name: "SMS", allowMultiple: true },
  { id: "voice", name: "Телефония", allowMultiple: false },
  { id: "whatsapp", name: "WhatsApp", allowMultiple: false },
  { id: "facebook", name: "Facebook", allowMultiple: false },
];

export const KNOWLEDGE_FILE_TYPES = [
  {
    id: "pdf",
    name: "PDF",
    icon: "picture_as_pdf",
    bg: "bg-red-100",
    color: "text-red-600",
  },
  {
    id: "doc",
    name: "Word",
    icon: "description",
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    id: "ppt",
    name: "PowerPoint",
    icon: "slideshow",
    bg: "bg-orange-100",
    color: "text-orange-600",
  },
  {
    id: "xls",
    name: "Excel",
    icon: "table_chart",
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    id: "txt",
    name: "Text",
    icon: "text_snippet",
    bg: "bg-neutral-100",
    color: "text-neutral-600",
  },
  {
    id: "image",
    name: "Image",
    icon: "image",
    bg: "bg-purple-100",
    color: "text-purple-600",
  },
];

export const ASSISTANT_ICONS = [
  { id: "sales", icon: "paid" },
  { id: "support", icon: "support_agent" },
  { id: "marketing", icon: "campaign" },
  { id: "general", icon: "smart_toy" },
  { id: "technical", icon: "code" },
  { id: "billing", icon: "account_balance" },
  { id: "hr", icon: "people" },
];

export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return sizeInBytes + " B";
  } else if (sizeInBytes < 1024 * 1024) {
    return (sizeInBytes / 1024).toFixed(1) + " KB";
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
  } else {
    return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }
}
