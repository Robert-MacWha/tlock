<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import '../app.css';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<Header />

<main style="padding-top: 80px;">
    {@render children?.()}
</main>

<Footer />
