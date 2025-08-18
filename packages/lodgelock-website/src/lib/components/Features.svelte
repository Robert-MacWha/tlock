<script>
    import Icon from '@iconify/svelte';
</script>

<section class="features py-5">
    <div class="container">
        <div class="row">
            <div class="col-12 text-center mb-3">
                <h2 class="display-6 fw-bold">Why Lodgelock?</h2>
                <p class="lead text-muted">
                    Harden your resistance against private key theft with
                    hardware-wallet-like security
                </p>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <div class="col-md-4">
                <div class="card h-100 shadow border-0 rounded">
                    <div class="card-body position-relative">
                        <div
                            class="feature-icon mb-2 text-secondary bg-elevation-2"
                        >
                            <Icon
                                icon="mdi:shield-key"
                                width="24"
                                height="24"
                            />
                        </div>
                        <h5 class="card-title">Separated Security</h5>
                        <p class="card-text text-muted">
                            Your private keys never touch your computer or
                            browser. They stay safely on your mobile device,
                            isolated from potential malware and hackers.
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card h-100 shadow border-0 rounded">
                    <div class="card-body position-relative">
                        <div
                            class="feature-icon mb-2 text-secondary bg-elevation-2"
                        >
                            <Icon
                                icon="mdi:cellphone-check"
                                width="24"
                                height="24"
                            />
                        </div>
                        <h5 class="card-title">Device Authentication</h5>
                        <p class="card-text text-muted">
                            Every transaction requires explicit approval on your
                            mobile device with biometric or PIN authentication,
                            ensuring only you can authorize actions.
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card h-100 shadow border-0 rounded">
                    <div class="card-body position-relative">
                        <div
                            class="feature-icon mb-2 text-secondary bg-elevation-2"
                        >
                            <Icon
                                icon="mdi:connection"
                                width="24"
                                height="24"
                            />
                        </div>
                        <h5 class="card-title">Seamless Integration</h5>
                        <p class="card-text text-muted">
                            Lodgelock accounts are integrated seamlessly into
                            metamask, allowing you to view balances, initiate
                            transactions, and sign messages from the extension.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .feature-icon {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
