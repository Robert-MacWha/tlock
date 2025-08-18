<script>
    import Icon from '@iconify/svelte';
</script>

<section class="problem py-5">
    <div class="container">
        <div class="row mb-3">
            <div class="col-12">
                <h2 class="display-6 fw-bold">The Problem is Real</h2>
                <p class="lead text-muted">
                    Crypto theft is a massive and growing problem
                </p>
            </div>
        </div>

        <div class="row g-4">
            <!-- First problem card -->
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-3">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-start">
                            <div
                                class="problem-icon me-3 text-secondary bg-elevation-2 rounded-circle d-flex align-items-center justify-content-center"
                            >
                                <Icon
                                    icon="mdi:trending-down"
                                    width="32"
                                    height="32"
                                />
                            </div>
                            <div class="flex-grow-1">
                                <h4 class="card-title fw-bold mb-3">
                                    Massive Financial Losses
                                </h4>
                                <p class="card-text text-muted">
                                    Over $960M<sup>1</sup> was lost to private
                                    key theft in 2024 alone, with hackers
                                    increasingly targeting hot wallets and
                                    browser extensions. Once keys are
                                    compromised, funds are recovered in 0.0% of
                                    cases.<sup>2</sup>
                                </p>
                                <p class="card-text text-muted mb-0">
                                    <small class="text-muted"
                                        ><sup>1</sup>
                                        <a
                                            href="https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2025/"
                                            >https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2025/</a
                                        ><br />
                                        <sup>2</sup> Rounded, but it's really, really
                                        bad</small
                                    >
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Second problem card -->
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-3">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-start">
                            <div
                                class="problem-icon me-3 text-secondary bg-elevation-2 rounded-circle d-flex align-items-center justify-content-center"
                            >
                                <Icon
                                    icon="mdi:shield-alert"
                                    width="32"
                                    height="32"
                                />
                            </div>
                            <div class="flex-grow-1">
                                <h4 class="card-title fw-bold mb-3">
                                    Browser Wallets Are Vulnerable
                                </h4>
                                <p class="card-text text-muted mb-2">
                                    Traditional browser wallets store private
                                    keys directly on your computer, making them
                                    prime targets for malware, phishing attacks,
                                    and browser exploits. Private key theft is
                                    now the #1 most common incident reported to
                                    SEAL911, the crypto security emergency
                                    response service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .problem-icon {
        width: 40px;
        height: 40px;
        min-width: 40px;
    }
</style>
