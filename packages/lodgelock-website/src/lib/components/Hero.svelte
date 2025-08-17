<script lang="ts">
    import { onMount } from 'svelte';

    import phoneOutline from '$lib/assets/demo-screenshots/phone-outline.png';

    import wallets from '$lib/assets/demo-screenshots/wallets.png';
    import requests from '$lib/assets/demo-screenshots/requests.png';
    import signTransaction from '$lib/assets/demo-screenshots/sign-transaction.png';
    import signApproved from '$lib/assets/demo-screenshots/sign-approved.png';

    let currentSlide = 0;
    const slides = [
        {
            image: wallets,
            description: 'Manage multiple accounts',
        },
        {
            image: requests,
            description: 'Receive new requests',
        },
        {
            image: signTransaction,
            description: 'Review pending transactions',
        },
        {
            image: signApproved,
            description: 'Approve and sign securely',
        },
    ];

    onMount(() => {
        const interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
        }, 4000);

        return () => clearInterval(interval);
    });
</script>

<section class="hero py-5 mb-4">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 col-md-7 mb-5">
                <h1 class="display-4 fw-bold">Lodgelock</h1>
                <h5 class="mb-4">Off-device signing for crypto transactions</h5>
                <p class="mb-4">
                    Lodgelock integrates with Metamask and a paired companion
                    app to create a convenient, more secure signing process.
                    Private keys are kept securely on your mobile device,
                    letting you view your account & initiate transactions
                    seamlessly from within metamask.
                </p>
                <div class="d-flex gap-3">
                    <a href="#email-signup" class="btn btn-primary">
                        Get Notified
                    </a>
                    <a
                        href="https://github.com/Robert-MacWha/lodgelock-snap"
                        class="btn btn-outline-primary"
                    >
                        Learn More
                    </a>
                </div>
            </div>

            <div class="col-lg-6 col-md-5">
                <div class="phone-frame position-relative mx-auto">
                    <img
                        src={phoneOutline}
                        alt="Phone mockup"
                        class="phone-bg w-100"
                    />

                    <div class="screen-overlay position-absolute">
                        {#each slides as slide, index}
                            <img
                                src={slide.image}
                                alt={slide.description}
                                class="screenshot position-absolute w-100 h-100"
                                class:active={index === currentSlide}
                                style="transition: opacity 0.5s ease-in-out; opacity: {index ===
                                currentSlide
                                    ? 1
                                    : 0}; object-fit: contain;"
                            />
                        {/each}
                    </div>
                    <!-- Slide indicators positioned above the description -->
                    <div
                        class="indicators position-absolute w-100 d-flex justify-content-center gap-1"
                    >
                        {#each slides as _, index}
                            <!-- svelte-ignore a11y_consider_explicit_label -->
                            <button
                                class="indicator bg-primary rounded-circle border-0"
                                class:active={index === currentSlide}
                                style="opacity: {index === currentSlide
                                    ? 1
                                    : 0.4};"
                                on:click={() => (currentSlide = index)}
                            ></button>
                        {/each}
                    </div>

                    <div class="descriptions position-absolute">
                        {#each slides as slide, index}
                            <div
                                class="description"
                                class:active={index === currentSlide}
                            >
                                {slide.description}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .phone-frame {
        max-width: 300px;
    }

    .phone-bg {
        position: relative;
        z-index: 2;
    }

    .screen-overlay {
        top: 18px;
        left: 18px;
        right: 18px;
        bottom: 18px;
        z-index: 1;
    }

    .screenshot {
        top: 0;
        left: 0;
    }

    .indicators {
        bottom: 24px;
    }

    .indicator {
        cursor: pointer;
        transition: opacity 0.3s ease;
        z-index: 3;
        width: 6px;
        height: 8px;
    }

    .indicator:hover {
        opacity: 0.7 !important;
    }

    .descriptions {
        bottom: -8px;
        left: 0;
        right: 0;
        text-align: center;
        z-index: 3;
    }

    .description {
        position: absolute;
        width: 100%;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        color: #333;
        line-height: 1.2;
        padding: 0 8px;
    }

    .description.active {
        opacity: 1;
    }
</style>
