<script lang="ts">
    import Hero from '$lib/components/Hero.svelte';
    import Features from '$lib/components/Features.svelte';
    import EmailForm from '$lib/components/EmailForm.svelte';
    import Problem from '$lib/components/Problem.svelte';
</script>

<svelte:head>
    <title>Lodgelock - Hardware-like wallet security without the hardware</title
    >
    <meta
        name="description"
        content="Secure your crypto with Lodgelock - hardware-like wallet security using your mobile device. Open source, free, and designed to prevent private key theft."
    />
    <meta
        property="og:title"
        content="Lodgelock - Hardware-like wallet security without the hardware"
    />
    <meta
        property="og:description"
        content="Secure your crypto with Lodgelock - hardware-like wallet security using your mobile device. Open source, free, and designed to prevent private key theft."
    />
    <meta property="og:type" content="website" />
</svelte:head>

<main>
    <Hero />
    <div class="bg-elevation-1">
        <Problem />
    </div>
    <Features />
    <div class="bg-elevation-1">
        <EmailForm />
    </div>
</main>
