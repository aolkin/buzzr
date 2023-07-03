import { writable } from 'svelte/store';

export const logDisplay = writable('');

const logs: string[] = [];

function addLog(args: unknown[]) {
	// console.trace(...args);
	logs.push(
		args
			.map((arg) => {
				try {
					return JSON.stringify(arg);
				} catch {
					return arg;
				}
			})
			.join(' ')
	);
	if (logs.length > 4) {
		logs.shift();
	}
	logDisplay.set(logs.join('\n'));
}

export function debug(...args: unknown[]) {
	console.debug(...args);
	addLog(args);
}

export function log(...args: unknown[]) {
	console.log(...args);
	addLog(args);
}

export function warn(...args: unknown[]) {
	console.warn(...args);
	addLog(args);
}

export function error(...args: unknown[]) {
	console.error(...args);
	addLog(args);
}
