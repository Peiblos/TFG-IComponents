<?php

namespace App\Controller\Api;

use App\Entity\Product;
use App\Repository\ProductRepository;
use App\Repository\CategoryRepository;
use App\Repository\BrandRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

#[Route('/api/products')]
class ProductController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(Request $request, ProductRepository $repo): Response
    {
        $criteria = [];

        if ($request->query->get('category')) {
            $criteria['category'] = $request->query->get('category');
        }

        if ($request->query->get('brand')) {
            $criteria['brand'] = $request->query->get('brand');
        }

        $products = $repo->findBy($criteria);

        $data = array_map(function (Product $p) {
            return [
                'id' => $p->getId(),
                'sku' => $p->getSku(),
                'manufacturerReference' => $p->getManufacturerReference(),
                'name' => $p->getName(),
                'description' => $p->getDescription(),
                'price' => (float) $p->getPrice(),
                'discount' => $p->getDiscount(),
                'stock' => $p->getStock(),
                'category' => $p->getCategory()?->getName(),
                'brand' => $p->getBrand()?->getName(),
                'imageUrl' => $p->getImageUrl(),
                'isActive' => $p->isActive(),
            ];
        }, $products);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Product $product = null): Response
    {
        if (!$product) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->json([
            'id' => $product->getId(),
            'sku' => $product->getSku(),
            'manufacturerReference' => $product->getManufacturerReference(),
            'name' => $product->getName(),
            'description' => $product->getDescription(),
            'price' => (float) $product->getPrice(),
            'discount' => $product->getDiscount(),
            'stock' => $product->getStock(),
            'brand' => $product->getBrand()?->getName(),
            'category' => $product->getCategory()?->getName(),
            'imageUrl' => $product->getImageUrl(),
            'isActive' => $product->isActive(),
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        CategoryRepository $catRepo,
        BrandRepository $brandRepo
    ): Response {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $product = new Product();

        $product->setName($request->request->get('name', ''));
        $product->setDescription($request->request->get('description', ''));
        $product->setPrice((string) $request->request->get('price', 0));
        $product->setDiscount((int) $request->request->get('discount', 0));
        $product->setStock((int) $request->request->get('stock', 0));
        $product->setIsActive($request->request->getBoolean('isActive', true));
        $product->setCreatedAt(new \DateTimeImmutable());

        $product->setManufacturerReference(
            $request->request->get('manufacturerReference') ?: null
        );

        $categoryId = $request->request->get('categoryId');

        if ($categoryId) {
            $category = $catRepo->find($categoryId);

            if (!$category) {
                return $this->json(['error' => 'Category not found'], 404);
            }

            $product->setCategory($category);
        }

        $brandId = $request->request->get('brandId');

        if ($brandId) {
            $brand = $brandRepo->find($brandId);

            if (!$brand) {
                return $this->json(['error' => 'Brand not found'], 404);
            }

            $product->setBrand($brand);
        }

        $image = $request->files->get('image');

        if ($image) {
            $newFilename = uniqid('product_', true) . '.' . $image->guessExtension();

            try {
                $image->move(
                    $this->getParameter('kernel.project_dir') . '/public/uploads/products',
                    $newFilename
                );

                $product->setImageUrl('/uploads/products/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Error uploading image'], 500);
            }
        }

        $em->persist($product);
        $em->flush();

        $product->setSku('ICOMP-' . str_pad($product->getId(), 4, '0', STR_PAD_LEFT));
        $em->flush();

        return $this->json([
            'message' => 'created',
            'id' => $product->getId(),
            'sku' => $product->getSku(),
            'manufacturerReference' => $product->getManufacturerReference(),
            'imageUrl' => $product->getImageUrl(),
        ], 201);
    }

    #[Route('/{id}', methods: ['POST'])]
    public function update(
        Request $request,
        Product $product = null,
        EntityManagerInterface $em,
        CategoryRepository $catRepo,
        BrandRepository $brandRepo
    ): Response {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        if (!$product) {
            return $this->json(['error' => 'Not found'], 404);
        }

        if ($request->request->has('name')) {
            $product->setName($request->request->get('name'));
        }

        if ($request->request->has('description')) {
            $product->setDescription($request->request->get('description'));
        }

        if ($request->request->has('price')) {
            $product->setPrice((string) $request->request->get('price'));
        }

        if ($request->request->has('discount')) {
            $product->setDiscount((int) $request->request->get('discount'));
        }

        if ($request->request->has('stock')) {
            $product->setStock((int) $request->request->get('stock'));
        }

        if ($request->request->has('isActive')) {
            $product->setIsActive($request->request->getBoolean('isActive'));
        }

        if ($request->request->has('manufacturerReference')) {
            $product->setManufacturerReference(
                $request->request->get('manufacturerReference') ?: null
            );
        }

        if ($request->request->has('categoryId')) {
            $category = $catRepo->find($request->request->get('categoryId'));

            if (!$category) {
                return $this->json(['error' => 'Category not found'], 404);
            }

            $product->setCategory($category);
        }

        if ($request->request->has('brandId')) {
            $brand = $brandRepo->find($request->request->get('brandId'));

            if (!$brand) {
                return $this->json(['error' => 'Brand not found'], 404);
            }

            $product->setBrand($brand);
        }

        $image = $request->files->get('image');

        if ($image) {
            $newFilename = uniqid('product_', true) . '.' . $image->guessExtension();

            try {
                $image->move(
                    $this->getParameter('kernel.project_dir') . '/public/uploads/products',
                    $newFilename
                );

                if ($product->getImageUrl()) {
                    $oldImagePath = $this->getParameter('kernel.project_dir') . '/public' . $product->getImageUrl();

                    if (file_exists($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }

                $product->setImageUrl('/uploads/products/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Error uploading image'], 500);
            }
        }

        $em->flush();

        return $this->json([
            'message' => 'updated',
            'id' => $product->getId(),
            'sku' => $product->getSku(),
            'manufacturerReference' => $product->getManufacturerReference(),
            'imageUrl' => $product->getImageUrl(),
        ]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Product $product = null, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        if (!$product) {
            return $this->json(['error' => 'Not found'], 404);
        }

        if (!$product->getOrderLines()->isEmpty()) {
            return $this->json([
                'error' => 'Este producto tiene pedidos asociados. Archívalo en lugar de eliminarlo.'
            ], 409);
        }

        $em->remove($product);
        $em->flush();

        return $this->json(['message' => 'Producto eliminado correctamente']);
    }
}