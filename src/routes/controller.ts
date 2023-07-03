import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';

const COLORS = ['cyan', 'rose', 'indigo', 'emerald', 'amber', 'lime', 'red', 'sky'];

export class Subscribable<T> {
	private subscribers: Subscriber<T>[] = [];

	constructor(private _value: T) {}

	get value() {
		return this._value;
	}

	set value(value: T) {
		this._value = value;
		this.notify(value);
	}

	subscribe(subscriber: Subscriber<T>): Unsubscriber {
		if (this.subscribers.length === 0) {
			this.startTicking();
		}
		this.subscribers.push(subscriber);
		subscriber(this._value);
		return () => {
			this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
			if (this.subscribers.length === 0) {
				this.stopTicking();
			}
		};
	}

	notify(value: T) {
		this.subscribers.forEach((subscriber) => subscriber(value));
	}

	protected startTicking() {
		// Override in subclass
	}

	protected stopTicking() {
		// Override in subclass
	}
}

export class Button extends Subscribable<boolean> implements Readable<boolean> {
	constructor(private controller: Controller, pressed = false) {
		super(pressed);
	}

	get pressed() {
		return this.value;
	}

	set pressed(value: boolean) {
		if (value !== this.value) {
			this.value = value;
		}
	}

	protected startTicking() {
		this.controller.startMonitoring();
	}

	protected stopTicking() {
		this.controller.stopMonitoring();
	}
}

export class Controller {
	gamepad: Gamepad;
	connected: boolean;
	buttons: Button[];
	_label: string;

	private static monitored: Record<number, Controller> = {};
	private static animationFrame?: number;

	constructor(gamepad: Gamepad) {
		this.gamepad = gamepad;
		this.connected = gamepad.connected;
		this._label = localStorage.getItem(`controller-label-${gamepad.index}`) || gamepad.id;
		this.buttons = gamepad.buttons.map((button) => new Button(this, button.pressed));
	}

	get label() {
		return this._label;
	}

	set label(value: string) {
		this._label = value;
		localStorage.setItem(`controller-label-${this.gamepad.index}`, value);
	}

	get color() {
		return COLORS[this.gamepad.index % COLORS.length];
	}

	get index() {
		return this.gamepad.index;
	}

	vibrate(duration?: number) {
		if (this.gamepad.vibrationActuator) {
			this.gamepad.vibrationActuator.playEffect('dual-rumble', {
				duration: duration ?? 300,
				strongMagnitude: 1,
				weakMagnitude: 0.5
			});
		}
	}

	startMonitoring() {
		const existingController = Controller.monitored[this.gamepad.index];
		if (existingController !== undefined && existingController !== this) {
			console.error('Already monitoring a different controller at this index?', existingController);
			return;
		}
		Controller.monitored[this.gamepad.index] = this;
		if (!Controller.animationFrame) {
			Controller.tick();
		}
	}

	stopMonitoring() {
		if (Controller.monitored[this.gamepad.index] !== undefined) {
			delete Controller.monitored[this.gamepad.index];
			if (Object.keys(Controller.monitored).length === 0 && Controller.animationFrame) {
				cancelAnimationFrame(Controller.animationFrame);
				Controller.animationFrame = undefined;
			}
		}
	}

	static tick() {
		Controller.animationFrame = requestAnimationFrame(() => Controller.tick());
		getGamepads().forEach((gamepad) => {
			const controller = Controller.monitored[gamepad.index];
			if (controller) {
				gamepad.buttons.forEach((button, index) => {
					controller.buttons[index].pressed = button.pressed;
				});
			}
		});
	}
}

export function getGamepads(): Gamepad[] {
	return navigator.getGamepads().filter((gp): gp is Gamepad => gp !== null);
}
