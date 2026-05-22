import { onEvent } from "@/core/events";
import { runAutomation } from "./engine";

let registered = false;

export function registerAutomationHandlers() {
  if (registered) return;
  registered = true;
  onEvent(async (event) => {
    await runAutomation(event);
  });
}
