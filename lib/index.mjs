import z from "@deepseek-ai/schemastery";
//#region src/classifier.js
const DEFAULT_RULES = ["too many pending requests, please retry later", "our servers are currently overloaded. please try again later"];
const VARIABLE_PATTERNS = [
	/\brequest id\s*:\s*[^)\s]+/gi,
	/\b(?:trace|correlation|request)[-_ ]?id\s*[:=]\s*[^\s,)]+/gi,
	/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi
];
/** Remove provider labels and per-request identifiers while keeping diagnostics. */
function normalizeMessage(message) {
	let value = String(message ?? "").replace(/^(?:unknown|server_error):\s*/i, "").trim();
	for (const pattern of VARIABLE_PATTERNS) value = value.replace(pattern, "");
	return value.replace(/\(\s*\)/g, "").replace(/\s+/g, " ").replace(/[.。]+$/, "").trim().toLowerCase();
}
/** Find the stable words shared by all selected samples. */
function commonStableFragment(messages) {
	const normalized = messages.map(normalizeMessage).filter(Boolean);
	if (normalized.length === 0) return "";
	const seed = normalized[0];
	const shared = seed.split(/\s+/).filter((word) => word.length >= 3).filter((word) => normalized.every((value) => value.includes(word)));
	if (shared.length === 0) return seed;
	return shared.join(" ");
}
/** Require a useful phrase before enabling a user-created message rule. */
function matchesRule(message, rule) {
	const value = normalizeMessage(message);
	const needle = normalizeMessage(rule);
	return needle.length >= 24 && value.includes(needle);
}
function createClassifier(initialRules = DEFAULT_RULES) {
	const rules = [...new Set(initialRules.map(normalizeMessage).filter((rule) => rule.length >= 24))];
	return {
		rules: () => [...rules],
		classify(message) {
			return rules.some((rule) => matchesRule(message, rule));
		},
		add(messages) {
			const rule = commonStableFragment(messages);
			if (rule.length >= 24 && !rules.includes(rule)) rules.push(rule);
			return rule;
		}
	};
}
//#endregion
//#region src/index.js
const name = "dsh-better-retry";
const inject = ["llm", "settings"];
const settingsSchema = z.object({ rules: z.array(z.string()).default([]) });
function classifierForRules(rules) {
	const custom = rules.length > 0 ? [commonStableFragment(rules)] : [];
	return createClassifier([...DEFAULT_RULES, ...custom]);
}
/**
* Classify selected provider failures and hand retry execution to dsh-llm-retry.
* The settings provider owns the durable file; this plugin owns only the
* classifier and its namespace.
*/
function apply(ctx) {
	const scope = ctx.settings.register("dsh-better-retry", settingsSchema, { base: { rules: [] } });
	let classifier = classifierForRules(scope.get().rules);
	scope.watch((next) => {
		classifier = classifierForRules(next.rules);
	});
	ctx.on("llm/stream", (_options, next) => rewriteStream(next(), () => classifier));
}
async function* rewriteStream(source, getClassifier) {
	for await (const chunk of source) {
		if (chunk?.type === "finish" && chunk.reason?.kind === "error") {
			const failure = chunk.reason.failure;
			if (failure?.code === "PI_AI_ERROR" && getClassifier().classify(failure.message)) {
				yield {
					...chunk,
					reason: {
						...chunk.reason,
						failure: {
							...failure,
							code: "RATE_LIMIT"
						}
					}
				};
				continue;
			}
		}
		yield chunk;
	}
}
//#endregion
export { apply, inject, name };

//# sourceMappingURL=index.mjs.map