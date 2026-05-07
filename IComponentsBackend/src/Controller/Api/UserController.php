<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Symfony\Component\HttpFoundation\JsonResponse;

#[Route('/api/users')]
class UserController extends AbstractController
{
    #[Route('/me', name: 'user_me', methods: ['GET'])]
    public function me(): Response
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        return $this->json($this->formatUser($user));
    }

    #[Route('/me/update', name: 'app_api_user_updateme', methods: ['PUT', 'PATCH'])]
    public function updateMe(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): Response {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['firstName'])) {
            $user->setName($data['firstName']);
        }

        if (isset($data['lastName'])) {
            $user->setSurname($data['lastName']);
        }

        if (isset($data['phone'])) {
            $user->setTlf($data['phone']);
        }

        if (!empty($data['password'])) {
            $user->setPassword($hasher->hashPassword($user, $data['password']));
        }

        $em->flush();

        return $this->json(['message' => 'User updated']);
    }

    #[Route('', name: 'api_admin_user_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(UserRepository $userRepository): Response
    {
        $users = $userRepository->findBy([], ['id' => 'ASC']);

        return $this->json(array_map(
            fn(User $user) => $this->formatUser($user),
            $users
        ));
    }

    #[Route('/{id}', name: 'api_admin_user_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        Request $request,
        User $user = null,
        EntityManagerInterface $em
    ): Response {
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['firstName'])) {
            $user->setName($data['firstName']);
        }

        if (isset($data['lastName'])) {
            $user->setSurname($data['lastName']);
        }

        if (isset($data['phone'])) {
            $user->setTlf($data['phone']);
        }

        if (isset($data['roles']) && is_array($data['roles'])) {
            $roles = array_values(array_unique($data['roles']));

            if (!in_array('ROLE_USER', $roles, true)) {
                $roles[] = 'ROLE_USER';
            }

            $user->setRoles($roles);
        }

        $em->flush();

        return $this->json(['message' => 'User updated']);
    }

    #[Route('/{id}', name: 'api_admin_user_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(
        ?User $user,
        EntityManagerInterface $em
    ): Response {
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if ($user === $this->getUser()) {
            return $this->json(['error' => 'You cannot delete yourself'], 400);
        }

        try {
            $em->remove($user);
            $em->flush();

            return $this->json(['message' => 'User deleted']);
        } catch (ForeignKeyConstraintViolationException $e) {
            return $this->json([
                'error' => 'No se puede eliminar este usuario porque tiene datos relacionados.',
                'details' => 'El usuario tiene pedidos, reseñas o direcciones asociadas.'
            ], Response::HTTP_CONFLICT);
        }
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getName(),
            'lastName' => $user->getSurname(),
            'phone' => $user->getTlf(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getRegistrationDate()?->format(\DateTime::ATOM),
            'addresses' => array_map(fn($address) => [
                'id' => $address->getId(),
                'street' => $address->getStreet(),
                'city' => $address->getCity(),
                'state' => $address->getState(),
                'postalCode' => $address->getPostalCode(),
                'country' => $address->getCountry(),
                'isDefault' => $address->isDefault(),
            ], $user->getAddresses()->toArray()),
        ];
    }
}