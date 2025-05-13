import { en, ru } from './translations';

// Добавляем недостающие переводы для английского языка
Object.assign(en.common, {
  sortOrder: "Sort order",
  change: "Change",
});

Object.assign(en.services, {
  iconSavedInDatabase: "Icon saved in database",
});

// Добавляем недостающие переводы для русского языка
Object.assign(ru.common, {
  sortOrder: "Порядок сортировки",
  change: "Изменить",
});

Object.assign(ru.services, {
  iconSavedInDatabase: "Иконка сохранена в базе данных",
});

// Добавляем все переводы в глобальный объект
export { en, ru };