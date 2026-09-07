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
			"remote"
		];
		const NS = "dsh-better-retry";
		const zh = {
			title: "本轮运行失败",
			add: "纳入自动重试",
			added: "已纳入自动重试",
			saving: "正在保存…",
			error: "保存失败"
		};
		const en = {
			title: "Run failed",
			add: "Enable automatic retry",
			added: "Automatic retry enabled",
			saving: "Saving…",
			error: "Save failed"
		};
		/** Browser renderer replacing the built-in terminal error row at a lower priority. */
		function BetterTurnError({ node, remote, locale }) {
			const [state, setState] = react.default.useState("idle");
			const copy = locale().startsWith("zh") ? zh : en;
			const add = async () => {
				setState("saving");
				try {
					const response = await remote.settings.describe();
					if (!response.ok) throw new Error(response.error.message);
					const view = response.value.namespaces.find((item) => item.ns === NS);
					const current = Array.isArray(view?.value?.rules) ? view.value.rules : [];
					if (!current.includes(node.message)) {
						const update = await remote.settings.update(NS, { rules: [...current, node.message] }, view?.revision);
						if (!update.ok) throw new Error(update.error.message);
					}
					setState("added");
				} catch (_error) {
					setState("error");
				}
			};
			return react.default.createElement("div", {
				className: "dsh-better-retry-row",
				role: "status"
			}, react.default.createElement("span", { className: "dsh-better-retry-title" }, copy.title), react.default.createElement("span", { className: "dsh-better-retry-message" }, node.message), node.code ? react.default.createElement("code", null, node.code) : null, react.default.createElement("button", {
				type: "button",
				disabled: state === "saving" || state === "added",
				onClick: add,
				title: copy.add,
				className: "dsh-better-retry-button"
			}, state === "saving" ? copy.saving : state === "added" ? copy.added : state === "error" ? copy.error : copy.add));
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-better-retry: locale");
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: "turn-error",
				priority: -1,
				locale: "chat",
				inject: () => ({
					remote: ctx.remote,
					locale: () => ctx.locale.getLocale().id
				})
			}, (props) => react.default.createElement(BetterTurnError, props)));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map