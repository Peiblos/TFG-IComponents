<?php

namespace App\Controller;

use App\Entity\ProductReview;
use App\Form\ProductReviewType;
use App\Repository\ProductReviewRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/product/review')]
final class ProductReviewController extends AbstractController
{
    #[Route(name: 'app_product_review_index', methods: ['GET'])]
    public function index(ProductReviewRepository $productReviewRepository): Response
    {
        return $this->render('product_review/index.html.twig', [
            'product_reviews' => $productReviewRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_product_review_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $productReview = new ProductReview();
        $form = $this->createForm(ProductReviewType::class, $productReview);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($productReview);
            $entityManager->flush();

            return $this->redirectToRoute('app_product_review_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('product_review/new.html.twig', [
            'product_review' => $productReview,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_product_review_show', methods: ['GET'])]
    public function show(ProductReview $productReview): Response
    {
        return $this->render('product_review/show.html.twig', [
            'product_review' => $productReview,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_product_review_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, ProductReview $productReview, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(ProductReviewType::class, $productReview);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_product_review_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('product_review/edit.html.twig', [
            'product_review' => $productReview,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_product_review_delete', methods: ['POST'])]
    public function delete(Request $request, ProductReview $productReview, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$productReview->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($productReview);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_product_review_index', [], Response::HTTP_SEE_OTHER);
    }
}
