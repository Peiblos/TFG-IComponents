<?php

namespace App\Enum;

enum OrderStatus: string
{
    case CART = 'cart';
    case PENDING = 'pending';
    case PAID = 'paid';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
}
