<?php

namespace App\Controller\Api;

use App\Entity\Payment;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/payments')]
class PaymentController extends AbstractController
{
    #[Route('/{id}', methods: ['GET'])]
    public function show(Payment $payment = null): Response
    {
        if (!$payment) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $order = $payment->getReferencedOrder();

        if (!$order) {
            return $this->json(['error' => 'Payment without order'], 400);
        }

        if (
            $order->getOwner()?->getId() !== $user->getId()
            && !in_array('ROLE_ADMIN', $user->getRoles(), true)
        ) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        return $this->json([
            'id' => $payment->getId(),
            'orderId' => $order->getId(),
            'status' => $payment->getStatus()?->value,
            'method' => $payment->getMethod()?->value,
            'amount' => (float) $payment->getAmount(),
            'paidAt' => $payment->getPaidAt()?->format(\DateTime::ATOM),
            'transactionReference' => $payment->getTransactionReference(),
        ]);
    }
}