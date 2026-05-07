<?php

namespace App\Controller\Api;

use App\Entity\Brand;
use App\Repository\BrandRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/brands')]
class BrandController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(BrandRepository $repo): Response
    {
        $brands = $repo->findAll();

        $data = array_map(fn(Brand $b) => [
            'id' => $b->getId(),
            'name' => $b->getName(),
            'description' => $b->getDescription(),
            'logoUrl' => $b->getLogoUrl(),
            'originCountry' => $b->getOriginCountry(),
        ], $brands);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Brand $brand = null): Response
    {
        if (!$brand) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->json([
            'id' => $brand->getId(),
            'name' => $brand->getName(),
            'description' => $brand->getDescription(),
            'logoUrl' => $brand->getLogoUrl(),
            'originCountry' => $brand->getOriginCountry(),
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        SluggerInterface $slugger
    ): Response {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $brand = new Brand();

        $name = $request->request->get('name', '');

        $brand->setName($name);
        $brand->setDescription($request->request->get('description'));
        $brand->setOriginCountry($request->request->get('originCountry'));

        $logo = $request->files->get('logo');

        if ($logo) {
            if ($logo->getMimeType() !== 'image/png') {
                return $this->json(['error' => 'Logo must be a PNG image'], 400);
            }

            $safeName = strtolower($slugger->slug($name)->toString());
            $newFilename = $safeName . '-' . bin2hex(random_bytes(3)) . '.png';

            try {
                $logo->move(
                    $this->getParameter('kernel.project_dir') . '/public/uploads/brands',
                    $newFilename
                );

                $brand->setLogoUrl('/uploads/brands/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Error uploading logo'], 500);
            }
        }

        $em->persist($brand);
        $em->flush();

        return $this->json([
            'message' => 'created',
            'id' => $brand->getId(),
            'logoUrl' => $brand->getLogoUrl(),
        ], 201);
    }

    #[Route('/{id}', methods: ['POST'])]
    public function update(
        Request $request,
        Brand $brand = null,
        EntityManagerInterface $em,
        SluggerInterface $slugger
    ): Response {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        if (!$brand) {
            return $this->json(['error' => 'Not found'], 404);
        }

        if ($request->request->has('name')) {
            $brand->setName($request->request->get('name'));
        }

        if ($request->request->has('description')) {
            $brand->setDescription($request->request->get('description'));
        }

        if ($request->request->has('originCountry')) {
            $brand->setOriginCountry($request->request->get('originCountry'));
        }

        $logo = $request->files->get('logo');

        if ($logo) {
            if ($logo->getMimeType() !== 'image/png') {
                return $this->json(['error' => 'Logo must be a PNG image'], 400);
            }

            $safeName = strtolower($slugger->slug($brand->getName())->toString());
            $newFilename = $safeName . '-' . bin2hex(random_bytes(3)) . '.png';

            try {
                $logo->move(
                    $this->getParameter('kernel.project_dir') . '/public/uploads/brands',
                    $newFilename
                );

                if ($brand->getLogoUrl()) {
                    $oldLogoPath = $this->getParameter('kernel.project_dir') . '/public' . $brand->getLogoUrl();

                    if (file_exists($oldLogoPath)) {
                        unlink($oldLogoPath);
                    }
                }

                $brand->setLogoUrl('/uploads/brands/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Error uploading logo'], 500);
            }
        }

        $em->flush();

        return $this->json([
            'message' => 'updated',
            'logoUrl' => $brand->getLogoUrl(),
        ]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Brand $brand = null, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        if (!$brand) {
            return $this->json(['error' => 'Not found'], 404);
        }

        if ($brand->getProducts()->count() > 0) {
            return $this->json([
                'error' => 'No puedes eliminar una marca con productos asociados'
            ], 400);
        }

        $logoUrl = $brand->getLogoUrl();

        $em->remove($brand);
        $em->flush();

        if ($logoUrl) {
            $logoPath = $this->getParameter('kernel.project_dir') . '/public' . $logoUrl;

            if (file_exists($logoPath)) {
                unlink($logoPath);
            }
        }

        return $this->json(['message' => 'deleted']);
    }
}