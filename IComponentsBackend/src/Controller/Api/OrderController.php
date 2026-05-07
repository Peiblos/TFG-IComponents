<?php


namespace App\Controller\Api;

use App\Entity\Order;
use App\Enum\OrderStatus;
use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use App\Entity\Payment;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('/current', name: 'api_order_current', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function current(OrderRepository $orderRepository): JsonResponse
    {
        $order = $orderRepository->findOneBy([
            'owner' => $this->getUser(),
            'status' => OrderStatus::CART,
        ]);

        if (!$order) {
            return $this->json([
                'id' => null,
                'status' => OrderStatus::CART->value,
                'total' => 0,
                'lines' => [],
            ]);
        }

        return $this->json($this->formatOrder($order));
    }

    #[Route('', name: 'api_order_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(OrderRepository $orderRepository): JsonResponse
    {
        $orders = $orderRepository->findBy([
            'owner' => $this->getUser(),
        ], [
            'createdAt' => 'DESC',
        ]);

        return $this->json(array_map(
            fn (Order $order) => $this->formatOrder($order),
            $orders
        ));
    }

    #[Route('/admin/all', name: 'api_order_admin_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminList(OrderRepository $orderRepository): JsonResponse
    {
        $orders = $orderRepository->findBy([], [
            'createdAt' => 'DESC',
        ]);

        return $this->json(array_map(
            fn (Order $order) => $this->formatOrder($order),
            $orders
        ));
    }

    #[Route('/admin/{id}/status', name: 'api_order_admin_update_status', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateStatus(
        Order $order,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        // No permitir modificar carritos
        if ($order->getStatus() === OrderStatus::CART) {
            return $this->json([
                'error' => 'No se puede modificar un carrito.'
            ], 400);
        }

        $data = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;

        if (!$status) {
            return $this->json(['error' => 'Estado requerido'], 400);
        }

        $newStatus = OrderStatus::tryFrom($status);

        if (!$newStatus) {
            return $this->json(['error' => 'Estado no válido'], 400);
        }

        // Seguridad: no permitir volver a CART
        if ($newStatus === OrderStatus::CART) {
            return $this->json([
                'error' => 'No se puede volver a carrito.'
            ], 400);
        }

        $order->setStatus($newStatus);
        $em->flush();

        return $this->json([
            'message' => 'Estado actualizado correctamente',
            'status' => $order->getStatus()->value,
        ]);
    }

    #[Route('/{id}/checkout', name: 'api_order_checkout', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function checkout(Order $order, EntityManagerInterface $em): JsonResponse
    {
        if ($order->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if ($order->getStatus() !== OrderStatus::CART) {
            return $this->json(['error' => 'Order cannot be checked out'], 400);
        }

        if ($order->getOrderLines()->isEmpty()) {
            return $this->json(['error' => 'Cart is empty'], 400);
        }

        foreach ($order->getOrderLines() as $line) {
            $product = $line->getProduct();

            if ($product->getStock() < $line->getQuantity()) {
                return $this->json([
                    'error' => 'Not enough stock for product: ' . $product->getName()
                ], 400);
            }
        }

        foreach ($order->getOrderLines() as $line) {
            $product = $line->getProduct();
            $product->setStock($product->getStock() - $line->getQuantity());
        }

        $shippingAddress = null;

        foreach ($order->getOwner()->getAddresses() as $address) {
            if ($address->isDefault()) {
                $shippingAddress = $address;
                break;
            }
        }

        if (!$shippingAddress) {
            return $this->json([
                'error' => 'No tienes una dirección principal configurada.'
            ], 400);
        }

        $order->setShippingAddress($shippingAddress);

        $order->setStatus(OrderStatus::PAID);

        // crear Payment (simulado)
        $payment = new Payment();
        $payment->setReferencedOrder($order);
        $payment->setMethod(PaymentMethod::CARD); 
        $payment->setStatus(PaymentStatus::PAID);
        $payment->setAmount((string) $order->getTotal());
        $payment->setPaidAt(new \DateTimeImmutable());
        $payment->setTransactionReference('SIM-' . strtoupper(bin2hex(random_bytes(4))));

        $em->persist($payment);

        $em->flush();

        return $this->json([
            'message' => 'Order paid successfully',
            'orderId' => $order->getId(),
            'paymentId' => $payment->getId(),
        ]);
    }

    private function formatOrder(Order $order): array
    {
        $lines = [];

        foreach ($order->getOrderLines() as $line) {
            $product = $line->getProduct();

            $lines[] = [
                'id' => $line->getId(),
                'quantity' => $line->getQuantity(),
                'unitPrice' => (float) $line->getUnitPrice(),
                'subtotal' => (float) $line->getSubTotal(),
                'product' => [
                    'id' => $product->getId(),
                    'name' => $product->getName(),
                    'sku' => $product->getSku(),
                    'manufacturerReference' => $product->getManufacturerReference(),
                    'price' => (float) $product->getPrice(),
                    'discount' => $product->getDiscount(),
                    'imageUrl' => $product->getImageUrl(),
                ],
            ];
        }

        return [
            'id' => $order->getId(),
            'status' => $order->getStatus()?->value,
            'total' => (float) $order->getTotal(),
            'createdAt' => $order->getCreatedAt()?->format('Y-m-d H:i:s'),
            'shippingAddress' => $order->getShippingAddress() ? [
                'id' => $order->getShippingAddress()->getId(),
                'street' => $order->getShippingAddress()->getStreet(),
                'city' => $order->getShippingAddress()->getCity(),
                'state' => $order->getShippingAddress()->getState(),
                'postalCode' => $order->getShippingAddress()->getPostalCode(),
                'country' => $order->getShippingAddress()->getCountry(),
            ] : null,
                    'owner' => $order->getOwner() ? [
                'id' => $order->getOwner()->getId(),
                'email' => $order->getOwner()->getUserIdentifier(),
            ] : null,
            'lines' => $lines,
        ];
    }
}
