<?php

namespace App\Enum;

enum PaymentMethod: string
{
    case CARD = 'card';
    case PAYPAL = 'paypal';
    case TRANSFER = 'transfer';
}
