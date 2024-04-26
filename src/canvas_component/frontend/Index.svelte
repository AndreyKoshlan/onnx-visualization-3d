<script lang="ts">
	import {afterUpdate, onMount} from "svelte";
	import { BlockTitle } from "@gradio/atoms";
	import { Block } from "@gradio/atoms";
	import { View } from "./view/view"

	export let value;
	export let label: string;
	export let visible = true;
	export let elem_classes;
	export let elem_id;
	export let scale;
	export let info;
	export let min_width;
	export let show_label = true;
	export let interactive = true;

	afterUpdate(() => {
		if (value) {
			let _value = JSON.parse(value)
			view.setData(_value)
			window.received = _value
		}
	})

	onMount(() => {
		view = new View(canvas);
	})

	let canvas: HTMLCanvasElement;
	let view: View;
</script>

<Block
	{visible}
	{elem_id}
	{elem_classes}
	{scale}
	{min_width}
	allow_overflow={false}
	padding={true}
>
	<BlockTitle {show_label} {info}>{label}</BlockTitle>
	<canvas bind:this={canvas} disabled={!interactive}></canvas>
</Block>

<style>
	canvas {
		width: 100%;
		height: 80vh;
	}
</style>