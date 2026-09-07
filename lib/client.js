window.__ModuleLoader__.load({
	id: "dsh-better-retry",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		//#region src/client.js
		const inject = [
			"slots",
			"locale",
			"remote",
			"remote.settings"
		];
		const NS = "dsh-better-retry";
		const zh = {
			title: "本轮运行失败",
			add: "纳入自动重试",
			added: "已纳入自动重试",
			saving: "正在保存…",
			error: "保存失败",
			unavailable: "重试设置尚未加载"
		};
		const en = {
			title: "Run failed",
			add: "Enable automatic retry",
			added: "Automatic retry enabled",
			saving: "Saving…",
			error: "Save failed",
			unavailable: "Retry settings are not loaded"
		};
		/** The slot supplies a Chat node envelope; error fields belong to node.data. */
		function BetterTurnError({ node, t, addRule }) {
			const data = node.data;
			const [state, setState] = react.default.useState("idle");
			const [error, setError] = react.default.useState("");
			const add = async () => {
				setState("saving");
				setError("");
				try {
					await addRule(data.message);
					setState("added");
				} catch (failure) {
					setError(failure instanceof Error ? failure.message : String(failure));
					setState("error");
				}
			};
			return react.default.createElement("div", {
				role: "status",
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 8,
					alignItems: "baseline",
					overflowWrap: "anywhere"
				}
			}, react.default.createElement("span", { style: {
				color: "var(--dsw-alias-state-error-primary)",
				fontWeight: 600
			} }, t("title")), react.default.createElement("span", { style: { color: "var(--dsw-alias-label-secondary)" } }, data.message), data.code ? react.default.createElement("code", null, data.code) : null, react.default.createElement("button", {
				type: "button",
				disabled: state === "saving" || state === "added",
				onClick: add,
				title: error || t("add"),
				style: {
					flexShrink: 0,
					cursor: "pointer"
				}
			}, t(state === "saving" ? "saving" : state === "added" ? "added" : state === "error" ? "error" : "add")), error ? react.default.createElement("span", { role: "alert" }, error) : null);
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-better-retry: locale");
			const addRule = async (message) => {
				const response = await ctx.remote.settings.describe();
				if (!response.ok) throw new Error(response.error.message);
				const view = response.value.namespaces.find((item) => item.ns === NS);
				if (!view) throw new Error(ctx.locale.bind(NS)("unavailable"));
				const current = Array.isArray(view.value?.rules) ? view.value.rules : [];
				if (current.includes(message)) return;
				const update = await ctx.remote.settings.update(NS, { rules: [...current, message] }, view.revision);
				if (!update.ok) throw new Error(update.error.message);
			};
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "turn-error",
				priority: -1,
				locale: NS,
				inject: () => ({ addRule })
			}, BetterTurnError));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map