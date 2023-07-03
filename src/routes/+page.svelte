<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import Buzzer from './Buzzer.svelte';
	import { onMount } from 'svelte';
	import { Controller, getGamepads } from './controller';
	import dingMp3 from './ding.mp3';

	const RESET_DELAY = 5000;

	const controllers: Record<number, Controller> = {};

	let ding;
	let active: Controller | undefined = undefined;
	let tooSlow: Controller[] = [];
	let tooSlowTimeout: number[] = [];
	let columns: number;

	onMount(async () => {
		getGamepads().forEach((gp) => {
			controllers[gp.index] = new Controller(gp);
		});
	});

	function addGamepad(e) {
		controllers[e.gamepad.index] = new Controller(e.gamepad);
	}

	function removeGamepad(e) {
		console.log('Gamepad disconnected from index %d: %s', e.gamepad.index, e.gamepad.id);
		controllers[e.gamepad.index].connected = false;
	}

	function press(controller, e) {
		if (active === undefined) {
			controller.vibrate();
			ding.play();
			active = controller;
			tooSlow = [];
			tooSlowTimeout.forEach((timeout) => clearTimeout(timeout));
			setTimeout(() => {
				active = undefined;
				tooSlow = [];
			}, RESET_DELAY);
		} else if (active.index === controller.index) {
			// Repeated press, ignore
		} else {
			tooSlow = [controller, ...tooSlow];
			tooSlowTimeout.push(
				setTimeout(() => {
					tooSlow = tooSlow.slice(0, -1);
				}, RESET_DELAY / 2)
			);
		}
	}

	$: {
		const numControllers = Object.values(controllers).length;
		if (numControllers > 3) {
			columns = Math.ceil(numControllers / 2);
		} else {
			columns = numControllers;
		}
	}
</script>

<svelte:window on:gamepadconnected={addGamepad} on:gamepaddisconnected={removeGamepad} />

<audio src={dingMp3} bind:this={ding} />

<!-- Upper Toast Container -->
<div class="absolute w-screen top-4">
	<Toast color="green" simple class="mx-auto w-1/3 max-w-lg" open={active !== undefined}>
		<svg
			slot="icon"
			aria-hidden="true"
			class="w-5 h-5"
			fill="currentColor"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
			><path
				fill-rule="evenodd"
				d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
				clip-rule="evenodd"
			/></svg
		>
		<span class="text-base font-semibold">{active.label} buzzed in!</span>
	</Toast>
</div>

<!-- Buzzer Area -->
<div class={`h-screen grid grid-cols-${columns} place-content-evenly gap-4 p-4`}>
	{#each Object.values(controllers) as controller}
		<Buzzer
			{controller}
			active={active?.index === controller.index}
			anyActive={active !== undefined}
			on:press={(e) => press(controller, e)}
		/>
	{/each}
</div>

<!-- Lower Toast Container -->
<div class="absolute w-screen bottom-4">
	{#each tooSlow as slow}
		<Toast color="red" simple class="mx-auto w-1/3 max-w-lg mt-4">
			<svg
				slot="icon"
				aria-hidden="true"
				class="w-5 h-5"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path
					fill-rule="evenodd"
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/></svg
			>
			<span>{slow.label} was too slow!</span>
		</Toast>
	{/each}
</div>
