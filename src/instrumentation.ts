export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerAutomationHandlers } = await import("@/modules/automation");
    registerAutomationHandlers();
  }
}
