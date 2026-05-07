<?php
namespace App\Controller\Api;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/categories')]
class CategoryController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(CategoryRepository $repo): Response
    {
        $cats = $repo->findAll();
        $data = array_map(fn(Category $c)=>[
            'id'=>$c->getId(),
            'name'=>$c->getName(),
            'slug'=>$c->getSlug(),
            'description'=>$c->getDescription(),
            'parentId'=>$c->getParent()?->getId(),
        ], $cats);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Category $category = null): Response
    {
        if (!$category) return $this->json(['error'=>'Not found'],404);
        return $this->json([
            'id'=>$category->getId(),
            'name'=>$category->getName(),
            'slug'=>$category->getSlug(),
            'description'=>$category->getDescription(),
            'parentId'=>$category->getParent()?->getId(),
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $data = json_decode($request->getContent(), true);
        $category = new Category();
        $category->setName($data['name'] ?? '');
        $category->setSlug($data['slug'] ?? null);
        $category->setDescription($data['description'] ?? null);
        if (!empty($data['parentId'])) {
            $parent = $em->getRepository(Category::class)->find($data['parentId']);
            if ($parent) $category->setParent($parent);
        }
        $em->persist($category);
        $em->flush();
        return $this->json(['id'=>$category->getId()],201);
    }

    #[Route('/{id}', methods: ['PUT','PATCH'])]
    public function update(Request $request, Category $category = null, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        if (!$category) return $this->json(['error'=>'Not found'],404);

        $data = json_decode($request->getContent(), true);
        if (isset($data['name'])) $category->setName($data['name']);
        if (isset($data['slug'])) $category->setSlug($data['slug']);
        if (isset($data['description'])) $category->setDescription($data['description']);
        if (array_key_exists('parentId', $data)) {
            $parent = $data['parentId'] ? $em->getRepository(Category::class)->find($data['parentId']) : null;
            $category->setParent($parent);
        }
        $em->flush();
        return $this->json(['message'=>'updated']);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Category $category = null, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        if (!$category) return $this->json(['error'=>'Not found'],404);
        $em->remove($category);
        $em->flush();
        return $this->json(['message'=>'deleted']);
    }
}
