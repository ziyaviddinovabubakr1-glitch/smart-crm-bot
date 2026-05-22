import type { CrmEvent, EventHandler } from "./types";

const handlers: EventHandler[] = [];

export function onEvent(handler: EventHandler) {
  handlers.push(handler);
}

export async function emit(event: CrmEvent) {
  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[events] handler failed for ${event.type}:`, error);
      }
    })
  );
}
