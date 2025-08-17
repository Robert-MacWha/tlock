<script lang="ts">
    import { Turnstile } from 'svelte-turnstile';
    import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
    import { db } from '$lib/firebase';

    let turnstileToken = '';

    let email = '';
    let isSubmitting = false;
    let submitStatus: 'idle' | 'success' | 'error' = 'idle';
    let errorMessage = '';

    async function handleSubmit(event: Event) {
        event.preventDefault();

        if (!email || !email.includes('@')) {
            errorMessage = 'Please enter a valid email address';
            submitStatus = 'error';
            return;
        }

        if (!turnstileToken) {
            errorMessage = 'Security verification required';
            submitStatus = 'error';
            return;
        }

        isSubmitting = true;
        submitStatus = 'idle';

        try {
            await addDoc(collection(db, 'email-signups'), {
                email: email.toLowerCase().trim(),
                timestamp: serverTimestamp(),
                source: 'lodgelock-website',
                turnstileToken,
            });

            submitStatus = 'success';
            email = '';
            turnstileToken = '';
        } catch (error) {
            console.error('Error adding email:', error);
            errorMessage = 'Failed to save email. Please try again.';
            submitStatus = 'error';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<section id="email-signup" class="cta py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-8 text-center">
                <h2 class="display-6 fw-bold mb-4">
                    Ready to Secure Your Crypto?
                </h2>
                <p class="lead text-small mb-4">
                    Lodgelock is currently in development. Get notified when
                    it's ready for testing.
                </p>
            </div>
            <div class="col-lg-8">
                <div class="justify-content-center mb-4">
                    <form on:submit={handleSubmit}>
                        <div class="d-flex gap-2">
                            <div class="flex-grow-1">
                                <input
                                    type="email"
                                    class="form-control"
                                    placeholder="Enter your email address"
                                    bind:value={email}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                class="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {#if isSubmitting}
                                    <span
                                        class="spinner-border spinner-border-sm me-2"
                                        role="status"
                                    ></span>
                                    Saving...
                                {:else}
                                    Notify Me
                                {/if}
                            </button>
                            <a
                                href="https://github.com/Robert-MacWha/lodgelock-snap"
                                class="btn btn-outline-primary"
                            >
                                Learn More
                            </a>
                        </div>
                        <div class="mt-3">
                            <Turnstile
                                siteKey="0x4AAAAAABspd8Xqi8HPpfii"
                                size="flexible"
                                on:turnstile-callback={(e) =>
                                    (turnstileToken = e.detail.token)}
                                on:turnstile-error={() => (turnstileToken = '')}
                                theme="light"
                            />
                        </div>
                    </form>

                    {#if submitStatus === 'success'}
                        <div class="alert alert-success mt-3 mb-0">
                            <strong>Thanks!</strong> We'll notify you when Lodgelock
                            is ready.
                        </div>
                    {/if}

                    {#if submitStatus === 'error'}
                        <div class="alert alert-danger mt-3 mb-0">
                            <strong>Error:</strong>
                            {errorMessage}
                        </div>
                    {/if}

                    <p class="text-muted small mt-3 mb-0">
                        We'll only email you about Lodgelock updates. No spam,
                        unsubscribe anytime.
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>
