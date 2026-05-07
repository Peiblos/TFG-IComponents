<?php
namespace App\Controller\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    #[Route('/register', name: 'api_register', methods: ['POST', 'OPTIONS'])]
    public function register(Request $request, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $em): Response
    {
        if ($request->getMethod() === 'OPTIONS') {
            return $this->json([], 200);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['error' => 'email and password required'], 400);
        }

        $existing = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existing) {
            return $this->json(['error' => 'Email already used'], 400);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name'] ?? '');
        $user->setSurname($data['surName'] ?? '');
        $user->setRoles(['ROLE_USER']);

        $hashed = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashed);
        $user->setRegistrationDate(new \DateTime());

        $em->persist($user);
        $em->flush();

        return $this->json(['message' => 'User created'], 201);
    }

    // /api/login is handled by security json_login (JWT). For convenience a /me endpoint:
    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): Response
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getName(),
            'lastName' => $user->getSurname(),
            'roles' => $user->getRoles(),
        ]);
    }
}
