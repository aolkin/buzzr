<script>
	import '../app.postcss';
	import { DarkMode, SpeedDial, SpeedDialButton } from 'flowbite-svelte';
	import { logDisplay } from '$lib/debugger';
</script>

<SpeedDial defaultClass="absolute right-6 bottom-6">
	<DarkMode />
</SpeedDial>

<slot />

<!--<pre>-->
<!--	{$logDisplay}-->
<!--</pre>-->
