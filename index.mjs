// Mod
import hoverInset from './hover-inset.mjs';

/*
	JS制御のホバーイベントの実装。
		hoverin,hoveroutが発火する。
		判定まで任意の距離やディレイを設定できる。

		args
			1: element | string
				対象とする要素。
				stringならselectorとして扱い、それと一致する要素。
			2: op, object {
				signal: abortSignal, // 発火したらイベントを解除する
				inset: '10%', // ホバー判定を猶予する外周からの距離。 "px|%"
				delay: 100, // ホバー判定までのms
			}
		result
			none
*/


// ---- 状態 ----

const stateWeakMap = new WeakMap(); // Element → {timer, active, latestEvent, inset, mode, delay}
const selectorRegs = []; // [{selector, inset, mode, delay}]
let elementModeCount = 0;
let delegationInited = false;


// ---- 公開API ----

function onHover(arg, options = {}) {
	const {
		signal = new AbortController().signal,
		inset: insetStr = '10%',
		delay: delayVal = 100,
	} = options;

	const match = String(insetStr).match(/^(\d+(?:\.\d+)?)(px|%)$/);
	const inset = match ? +match[1] : 10;
	const mode = match ? match[2] : '%';
	const delay = delayVal;

	initDelegation();

	if (arg instanceof Element) {
		const el = arg;
		elementModeCount++;
		stateWeakMap.set(el, {
			timer: null,
			active: false,
			latestEvent: null,
			inset, mode, delay,
		});

		if (signal.aborted) {
			removeElement(el);
		} else {
			signal.addEventListener('abort', () => removeElement(el), {once: true});
		}
		return;
	}

	if (typeof arg === 'string') {
		const reg = { selector: arg, inset, mode, delay };
		selectorRegs.push(reg);
		signal.addEventListener('abort', () => removeSelector(reg), {once: true});
		return;
	}

	throw new TypeError('onHover: arg must be an Element or a selector string');
}


// ---- コアロジック ----

function isInsideZone(e, el, inset, mode) {
	const d = hoverInset(
		{ clientX: e.clientX, clientY: e.clientY, currentTarget: el },
		{ mode }
	);
	return d.top > inset && d.bottom > inset && d.left > inset && d.right > inset;
}

function fireIn(el, state, e) {
	state.active = true;
	el.dispatchEvent(new HoverEvent('hoverin', e));
}

function fireOut(el, state, e) {
	state.active = false;
	el.dispatchEvent(new HoverEvent('hoverout', e));
}

function startTimer(el, state, delay) {
	if (state.timer) return;
	state.timer = setTimeout(() => {
		if (state.active) return;
		fireIn(el, state, state.latestEvent);
	}, delay);
}

function cancel(el, state, e) {
	if (state.timer) { clearTimeout(state.timer); state.timer = null; }
	if (state.active) fireOut(el, state, e);
}


// ---- Delegation handlers ----

function findTargetElement(target) {
	// element mode: ancestor に stateWeakMap の要素があるか
	for (let parent = target; parent && parent !== document; parent = parent.parentElement) {
		const state = stateWeakMap.get(parent);
		if (state) {
			return {
				el: parent,
				reg: { inset: state.inset, mode: state.mode, delay: state.delay },
			};
		}
	}
	// selector mode
	for (const reg of selectorRegs) {
		const el = target.closest(reg.selector);
		if (el) return { el, reg };
	}
	return null;
}

function onMouseOver(e) {
	const matched = findTargetElement(e.target);
	if (!matched) return;
	const { el, reg } = matched;

	let state = stateWeakMap.get(el);
	if (!state) {
		// 初回。子孫間の移動なら無視
		if (e.relatedTarget && el.contains(e.relatedTarget)) return;
		state = {
			timer: null, active: false, latestEvent: null,
			inset: reg.inset, mode: reg.mode, delay: reg.delay,
		};
		stateWeakMap.set(el, state);
	}

	state.latestEvent = e;
	if (state.active) return;

	if (isInsideZone(e, el, reg.inset, reg.mode)) {
		if (state.timer) { clearTimeout(state.timer); state.timer = null; }
		fireIn(el, state, e);
		return;
	}
	startTimer(el, state, reg.delay);
}

function onMouseMove(e) {
	const matched = findTargetElement(e.target);
	if (!matched) return;
	const { el, reg } = matched;

	const state = stateWeakMap.get(el);
	if (!state || state.active || !state.timer) return;

	if (isInsideZone(e, el, reg.inset, reg.mode)) {
		clearTimeout(state.timer);
		state.timer = null;
		fireIn(el, state, e);
	}
}

function onMouseOut(e) {
	const matched = findTargetElement(e.target);
	if (!matched) return;
	const { el } = matched;

	// 子孫への移動なら無視
	if (e.relatedTarget && el.contains(e.relatedTarget)) return;

	const state = stateWeakMap.get(el);
	if (!state) return;

	cancel(el, state, e);
	// stateWeakMap は削除しない。再 entry 時に WeakMap のエントリを再利用する
}


// ---- 初期化・解除 ----

function initDelegation() {
	if (delegationInited) return;
	document.addEventListener('mouseover', onMouseOver, {capture: true});
	document.addEventListener('mousemove', onMouseMove, {capture: true});
	document.addEventListener('mouseout', onMouseOut, {capture: true});
	delegationInited = true;
}

function stopDelegationIfEmpty() {
	if (selectorRegs.length === 0 && elementModeCount === 0 && delegationInited) {
		document.removeEventListener('mouseover', onMouseOver, {capture: true});
		document.removeEventListener('mousemove', onMouseMove, {capture: true});
		document.removeEventListener('mouseout', onMouseOut, {capture: true});
		delegationInited = false;
	}
}

function removeSelector(reg) {
	const i = selectorRegs.indexOf(reg);
	if (i !== -1) selectorRegs.splice(i, 1);
	stopDelegationIfEmpty();
}

function removeElement(el) {
	const state = stateWeakMap.get(el);
	if (state && state.timer) {
		clearTimeout(state.timer);
	}
	stateWeakMap.delete(el);
	elementModeCount--;
	stopDelegationIfEmpty();
}


// ---- HoverEvent ----

class HoverEvent extends MouseEvent {
	get [Symbol.toStringTag]() { return 'HoverEvent'; }
}


export default onHover;
