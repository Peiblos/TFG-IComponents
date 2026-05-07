<?php

namespace App\Controller\Api;

use App\Entity\Order;
use App\Entity\OrderLine;
use App\Enum\OrderStatus;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/order-lines')]
class OrderLineController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private OrderRepository $orderRepository,
        private ProductRepository $productRepository
    ) {}

    #[Route('', name: 'api_order_line_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $productId = $data['productId'] ?? null;
        $quantity = (int) ($data['quantity'] ?? 1);

        if (!$productId || $quantity < 1) {
            return $this->json(['error' => 'Invalid product or quantity'], 400);
        }

        $product = $this->productRepository->find($productId);

        if (!$product) {
            return $this->json(['error' => 'Product not found'], 404);
        }

        if (!$product->isActive()) {
            return $this->json(['error' => 'Product is not active'], 400);
        }

        if ($product->getStock() < $quantity) {
            return $this->json(['error' => 'Not enough stock'], 400);
        }

        $order = $this->orderRepository->findOneBy([
            'owner' => $user,
            'status' => OrderStatus::CART,
        ]);

        if (!$order) {
            $order = new Order();
            $order->setOwner($user);
            $order->setStatus(OrderStatus::CART);
            $order->setTotal('0');
            $order->setCreatedAt(new \DateTimeImmutable());

            $this->em->persist($order);
        }

        foreach ($order->getOrderLines() as $existingLine) {
            if ($existingLine->getProduct()->getId() === $product->getId()) {
                $newQuantity = $existingLine->getQuantity() + $quantity;

                if ($product->getStock() < $newQuantity) {
                    return $this->json(['error' => 'Not enough stock'], 400);
                }

                $existingLine->setQuantity($newQuantity);
                $existingLine->setSubTotal(
                    (string) ((float) $existingLine->getUnitPrice() * $newQuantity)
                );

                $this->recalculateOrderTotal($order);
                $this->em->flush();

                return $this->json(['message' => 'Product quantity updated']);
            }
        }

        $unitPrice = $this->calculateFinalPrice(
            (float) $product->getPrice(),
            (int) $product->getDiscount()
        );

        $line = new OrderLine();
        $line->setParentOrder($order);
        $line->setProduct($product);
        $line->setQuantity($quantity);
        $line->setUnitPrice((string) $unitPrice);
        $line->setSubTotal((string) ($unitPrice * $quantity));

        $order->addOrderLine($line);

        $this->em->persist($line);
        $this->recalculateOrderTotal($order);
        $this->em->flush();

        return $this->json(['message' => 'Product added to cart'], 201);
    }

    #[Route('/{id}', name: 'api_order_line_update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(Request $request, OrderLine $orderLine): JsonResponse
    {
        $order = $orderLine->getParentOrder();

        if ($order->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if ($order->getStatus() !== OrderStatus::CART) {
            return $this->json(['error' => 'Cannot modify order after checkout'], 400);
        }

        $data = json_decode($request->getContent(), true);
        $quantity = (int) ($data['quantity'] ?? 1);

        if ($quantity < 1) {
            return $this->json(['error' => 'Quantity must be greater than 0'], 400);
        }

        if ($orderLine->getProduct()->getStock() < $quantity) {
            return $this->json(['error' => 'Not enough stock'], 400);
        }

        $orderLine->setQuantity($quantity);
        $orderLine->setSubTotal(
            (string) ((float) $orderLine->getUnitPrice() * $quantity)
        );

        $this->recalculateOrderTotal($order);
        $this->em->flush();

        return $this->json(['message' => 'Order line updated']);
    }

    #[Route('/{id}', name: 'api_order_line_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(OrderLine $orderLine): JsonResponse
    {
        $order = $orderLine->getParentOrder();

        if ($order->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if ($order->getStatus() !== OrderStatus::CART) {
            return $this->json(['error' => 'Cannot modify order after checkout'], 400);
        }

        $this->em->remove($orderLine);
        $this->em->flush();

        $this->recalculateOrderTotal($order);
        $this->em->flush();

        return $this->json(['message' => 'Order line deleted']);
    }

    private function calculateFinalPrice(float $price, int $discount): float
    {
        if ($discount <= 0) {
            return $price;
        }

        $safeDiscount = min($discount, 100);

        return round($price - ($price * ($safeDiscount / 100)), 2);
    }

    private function recalculateOrderTotal(Order $order): void
    {
        $total = 0;

        foreach ($order->getOrderLines() as $line) {
            $total += (float) $line->getSubTotal();
        }

        $order->setTotal((string) $total);
    }
}