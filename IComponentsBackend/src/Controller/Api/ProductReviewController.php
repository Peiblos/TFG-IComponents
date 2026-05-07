<?php

namespace App\Controller\Api;

use App\Entity\ProductReview;
use App\Repository\ProductReviewRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\ProductRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/product-reviews')]
class ProductReviewController extends AbstractController
{
    #[Route('/product/{productId}', methods: ['GET'])]
    public function byProduct(int $productId, ProductReviewRepository $repo): Response
    {
        $reviews = $repo->findBy(['product' => $productId], ['createdAt' => 'DESC']);

        $data = array_map(fn(ProductReview $r) => [
            'id' => $r->getId(),
            'userId' => $r->getOwner()?->getId(),
            'userName' => $r->getOwner()?->getName(),
            'rating' => $r->getRating(),
            'title' => $r->getTitle(),
            'comment' => $r->getComment(),
            'createdAt' => $r->getCreatedAt()?->format(\DateTime::ATOM),
        ], $reviews);

        return $this->json($data);
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        ProductRepository $productRepo
    ): Response {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        $product = $productRepo->find($data['productId'] ?? 0);

        if (!$product) {
            return $this->json(['error' => 'Product not found'], 404);
        }

        $rating = (int) ($data['rating'] ?? 5);

        if ($rating < 1 || $rating > 5) {
            return $this->json(['error' => 'Rating must be between 1 and 5'], 400);
        }

        $review = new ProductReview();
        $review->setOwner($user);
        $review->setProduct($product);
        $review->setRating($rating);
        $review->setTitle($data['title'] ?? null);
        $review->setComment($data['comment'] ?? '');
        $review->setCreatedAt(new \DateTimeImmutable());

        $em->persist($review);
        $em->flush();

        return $this->json([
            'message' => 'review created',
            'id' => $review->getId(),
        ], 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        ProductReviewRepository $repo,
        EntityManagerInterface $em
    ): Response {
        $review = $repo->find($id);

        if (!$review) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        if (
            $review->getOwner()?->getId() !== $user->getId()
            && !in_array('ROLE_ADMIN', $user->getRoles(), true)
        ) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $em->remove($review);
        $em->flush();

        return $this->json(['message' => 'deleted']);
    }
}