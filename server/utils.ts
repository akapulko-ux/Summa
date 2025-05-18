import { ZodError } from "zod";
import { Subscription } from "@shared/schema";

export function zValidationErrorToMessage(error: ZodError): string {
  return error.errors
    .map((err) => {
      const field = err.path.join(".");
      return `${field ? field + ": " : ""}${err.message}`;
    })
    .join(", ");
}

/**
 * Проверяет и определяет корректный статус подписки на основе даты "Оплачено до"
 * @param subscription Объект подписки
 * @returns Корректный статус подписки ("active", "pending", "expired")
 */
export function checkSubscriptionStatus(subscription: Subscription): string {
  // Если статус уже "canceled", не меняем его
  if (subscription.status === "canceled") {
    return "canceled";
  }
  
  // Если нет даты "Оплачено до", оставляем текущий статус
  if (!subscription.paidUntil) {
    return subscription.status || "active";
  }
  
  const now = new Date();
  const paidUntilDate = new Date(subscription.paidUntil);
  
  // Если дата уже прошла, статус "expired" (истекла)
  if (paidUntilDate < now) {
    return "expired";
  }
  
  // Вычисляем разницу в днях между текущей датой и датой "Оплачено до"
  const differenceInMs = paidUntilDate.getTime() - now.getTime();
  const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
  
  // Если до истечения меньше 35 дней, статус "pending" (заканчивается)
  if (differenceInDays <= 35) {
    return "pending";
  }
  
  // В противном случае статус "active" (активна)
  return "active";
}
