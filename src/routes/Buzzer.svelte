<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';

	// import * as console from '$lib/debugger';
	import { createEventDispatcher, onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import type { Controller } from './controller';

	export let controller: Controller;
	export let active: boolean;
	export let anyActive: boolean;
	export let rows: number;

	const pressed = derived(
		[0, 1, 2, 3].map((i) => controller.buttons[i]),
		([$buttonA, $buttonB, $buttonC, $buttonD]) => $buttonA || $buttonB || $buttonC || $buttonD
	);

	const dispatch = createEventDispatcher();

	onMount(() => {
		const unsubscribe = pressed.subscribe((value) => {
			if (value) {
				dispatch('press', {
					button: controller.buttons.findIndex((button) => button.pressed)
				});
			}
		});
		return () => {
			unsubscribe();
		};
	});

	const friendlyIndex = controller.index === 9 ? 0 : controller.index + 1;
	let labelModal = false;

	function handleKeypress(e) {
		if (e.key === friendlyIndex.toString()) {
			labelModal = true;
		}
	}
</script>

<svelte:window on:keypress={handleKeypress} />

<div class={`max-w-[80vw] ${rows === 2 ? 'max-h-[calc(50vh-3rem)]' : 'max-h-[calc(100vh-3rem)]'}`}>
	<div
		class={`mx-auto max-w-full max-h-full flex rounded-full aspect-square border-solid border-8 border-${
			controller.color
		}-500 bg-${controller.color}-${active ? 800 : 300} dark:bg-${controller.color}-${
			active ? 500 : 900
		} ${anyActive && !active ? 'opacity-70' : ''}`}
	>
		<div class="place-self-center text-center w-full text-slate-800 dark:text-slate-300 text-xl">
			<span class={controller.connected ? '' : 'text-slate-600'}>{controller.label}</span>
			{#if controller.label === controller.gamepad.id}
				<span class="text-slate-600">({friendlyIndex})</span>
			{/if}
		</div>
	</div>
</div>

<Modal bind:open={labelModal} size="xs" autoclose={false} class="w-full">
	<form class="flex flex-col space-y-6" on:submit|preventDefault={() => (labelModal = false)}>
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			Adjust label for {controller.gamepad.id} ({friendlyIndex})
		</h3>
		<Label class="space-y-2">
			<span>Label</span>
			<Input type="text" name="label" required bind:value={controller.label} />
		</Label>
		<Button type="submit" class="w-full1">Update</Button>
		<Button type="button" color="purple" class="w-full1" on:click={() => controller.vibrate(500)}
			>Vibrate</Button
		>
	</form>
</Modal>
