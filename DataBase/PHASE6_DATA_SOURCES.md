# Phase 6: Data Sources

## Источники данных

### 1. Emplanner (Primary)
**Статус:** Ручной парсинг через DevTools, ожидаем API

| Данные | Описание | Источник |
|--------|----------|----------|
| Заказы (Orders) | Список заказов на чертежи | Emplanner |
| Статусы заказов | В работе / Выполнен / На проверке | Emplanner |
| Драфтеры | Кто выполняет заказ | Emplanner |
| Ревьюеры | Кто проверяет заказ | Emplanner |
| История туров | Оценки, время выполнения, участники | Emplanner |
| emplannerUid | Уникальный ID пользователя | Emplanner |

**Формат ID:** `xx-xxxxxxx` (2 цифры года + 7 цифр контракта)

**API (будущее):** Emplanner предоставит API с доступом к BigQuery

---

### 2. Google Cloud / BigQuery (DS Shop)
**Статус:** Миграция с GoDaddy на Google Cloud

| Данные | Описание | Источник |
|--------|----------|----------|
| Депозит DS Shop | Баланс внутреннего магазина | Google Cloud |
| История покупок | Что купили сотрудники | Google Cloud |
| Товары | Каталог магазина | Google Cloud |

---

### 3. Slack
**Статус:** API доступен

| Данные | Описание | Источник |
|--------|----------|----------|
| Аватары | Фото профиля сотрудника | Slack API |
| Имя | Отображаемое имя | Slack API |
| Email | Рабочий email | Slack API |

**API:** `users.info`, `users.list`

---

### 4. Google Sheets
**Статус:** API доступен

| Данные | Описание | Источник |
|--------|----------|----------|
| Справочники | Various reference data | Google Sheets |
| Настройки | Конфигурации | Google Sheets |
| Ручные данные | Данные от менеджеров | Google Sheets |

**API:** Google Sheets API v4

---

## Модели данных

### Order (Заказ)

```prisma
model Order {
  id              String   @id @default(cuid())
  sourceOrderId   String   @unique  // ID из Emplanner
  title           String
  status          String   // draft, in_progress, review, completed
  
  // Связи
  drafterId       String?
  reviewerId      String?
  drafter         User?    @relation("DrafterOrders", fields: [drafterId], references: [id])
  reviewer        User?    @relation("ReviewerOrders", fields: [reviewerId], references: [id])
  
  // Метрики
  evaluation      Float?   // Оценка (0-100)
  startTime       DateTime?
  endTime         DateTime?
  durationHours   Float?   // Время выполнения в часах
  
  // Источник
  importBatchId   String?
  importBatch     ImportBatch? @relation(fields: [importBatchId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### ImportBatch (Пакет импорта)

```prisma
model ImportBatch {
  id              String   @id @default(cuid())
  source          String   // emplanner, slack, google_sheets, ds_shop
  status          String   // pending, running, completed, failed
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  recordsTotal    Int      @default(0)
  recordsImported Int      @default(0)
  errors          Json?
  
  orders          Order[]
  
  createdAt       DateTime @default(now())
}
```

---

## Source Adapter Interface

```typescript
// Базовый интерфейс для всех источников
interface SourceAdapter {
  name: string;
  fetch(): Promise<ImportData>;
}

// Данные для импорта
interface ImportData {
  orders?: OrderData[];
  users?: UserData[];
  // ... другие данные
}

// Данные заказа из источника
interface OrderData {
  sourceOrderId: string;
  title: string;
  status: string;
  drafterUid?: string;
  reviewerUid?: string;
  evaluation?: number;
  startTime?: Date;
  endTime?: Date;
}
```

---

## Реализации адаптеров

| Адаптер | Источник | Статус |
|---------|----------|--------|
| `EmplannerAdapter` | Emplanner API | ⏳ Ожидает API |
| `SlackAdapter` | Slack API | ✅ Готов к реализации |
| `GoogleSheetsAdapter` | Google Sheets API | ✅ Готов к реализации |
| `DsShopAdapter` | Google Cloud | ⏳ Ожидает миграции |

---

## Cron Jobs

| Job | Schedule | Описание |
|-----|----------|----------|
| `import.emplanner` | `0 2 * * *` | Импорт заказов из Emplanner |
| `import.slack` | `0 4 * * *` | Обновление аватаров из Slack |
| `import.google_sheets` | `0 5 * * *` | Импорт данных из Google Sheets |
| `import.ds_shop` | `0 6 * * *` | Импорт депозитов из DS Shop |

---

## Вопросы

1. **Emplanner API** — когда ожидаете? Есть ли документация?
2. **Google Cloud** — миграция завершена? Есть ли доступ к BigQuery?
3. **Slack** — есть ли Slack Workspace token?
4. **Google Sheets** — какие конкретно таблицы нужно импортировать?
5. **Оценки** — какой формат оценки? (0-100, 1-5, A-F?)
6. **Время выполнения** — в часах или рабочих днях?

---

## Приоритеты

| Приоритет | Источник | Данные |
|-----------|----------|--------|
| 🔴 High | Emplanner | Заказы, статусы, оценки |
| 🟡 Medium | Slack | Аватары |
| 🟡 Medium | Google Sheets | Справочники |
| 🟢 Low | DS Shop | Депозиты |
