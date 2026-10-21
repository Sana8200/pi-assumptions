import { StringEnum, Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface Flag {
	text: string;
	confidence: "low" | "medium" | "high";
}

export default function (pi: ExtensionAPI) {
	const flags: Flag[] = [];

	// Rebuild the list from the session file, so flags survive /reload and pi --continue.
	pi.on("session_start", async (_event, ctx) => {
		flags.length = 0;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "message") continue;
			const msg = entry.message;
			if (msg.role !== "toolResult" || msg.toolName !== "flag_assumption") continue;
			// Flags saved before details were stored have none; skip them.
			if (msg.details) flags.push(msg.details as unknown as Flag);
		}
		ctx.ui.setStatus("assumptions", flags.length > 0 ? `${flags.length} assumption(s) to review: /assumptions` : undefined);
	});

	pi.registerTool({
		name: "flag_assumption",
		label: "Assumption",
		description: "Record an assumption you made because the task did not say. The user reviews all flags later.",
		promptSnippet: "Flag an assumption for the user to review later",
		promptGuidelines: [
			"When a detail is unclear and a sensible default exists, choose it, call flag_assumption separately for each assumption, and keep working instead of asking.",
		],
		parameters: Type.Object({
			text: Type.String({ description: "The assumption, in one short sentence" }),
			confidence: StringEnum(["low", "medium", "high"] as const),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			flags.push({ text: params.text, confidence: params.confidence });
			ctx.ui.setStatus("assumptions", `${flags.length} assumption(s) to review: /assumptions`);
			// Only low-confidence flags interrupt; medium and high stay in the footer count.
			if (params.confidence === "low") {
				ctx.ui.notify(`Low-confidence assumption: ${params.text}`, "warning");
			}
			return {
				content: [{ type: "text", text: "Flagged. Continue with this assumption." }],
				details: { text: params.text, confidence: params.confidence },
			};
		},
	});

	pi.registerCommand("assumptions", {
		description: "Review the assumptions the agent flagged",
		handler: async (_args, ctx) => {
			if (flags.length === 0) {
				ctx.ui.notify("No assumptions flagged yet.", "info");
				return;
			}
			const choice = await ctx.ui.select(
				"Pick one that is wrong (Esc if all are fine)",
				flags.map((f) => `[${f.confidence}] ${f.text}`),
			);
			if (choice === undefined) return;
			pi.sendUserMessage(`This assumption is wrong: ${choice}. Fix the work that depends on it.`, {
				deliverAs: "followUp",
			});
		},
	});
}