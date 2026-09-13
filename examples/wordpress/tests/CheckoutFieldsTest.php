<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Tests;

use KenyaLocationsExample\WooCommerce\CheckoutFields;
use PHPUnit\Framework\TestCase;

final class CheckoutFieldsTest extends TestCase
{
    public function testReplacesCheckoutBlockOnFrontendCheckout(): void
    {
        $this->assertTrue(
            CheckoutFields::shouldReplaceCheckoutBlock('woocommerce/checkout', true),
        );
    }

    public function testLeavesCheckoutBlockOffCheckoutPages(): void
    {
        $this->assertFalse(
            CheckoutFields::shouldReplaceCheckoutBlock('woocommerce/checkout', false),
        );
    }

    public function testLeavesOtherBlocksAlone(): void
    {
        $this->assertFalse(
            CheckoutFields::shouldReplaceCheckoutBlock('core/paragraph', true),
        );
    }
}
