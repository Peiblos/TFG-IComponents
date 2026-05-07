<?php
namespace App\Controller\Api;

use App\Entity\Address;
use App\Repository\AddressRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/addresses')]
class AddressController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(AddressRepository $repo): Response
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error'=>'Unauthorized'],401);

        $addresses = $repo->findBy(['owner'=>$user]);

        $data = array_map(fn(Address $a)=>[
            'id'=>$a->getId(),
            'street'=>$a->getStreet(),
            'city'=>$a->getCity(),
            'state'=>$a->getState(),
            'postalCode'=>$a->getPostalCode(),
            'country'=>$a->getCountry(),
            'isDefault'=>$a->isDefault(),
        ], $addresses);

        return $this->json($data);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error'=>'Unauthorized'],401);

        $data = json_decode($request->getContent(), true);

        $a = new Address();
        $a->setOwner($user);
        $a->setStreet($data['street'] ?? '');
        $a->setCity($data['city'] ?? '');
        $a->setState($data['state'] ?? '');
        $a->setPostalCode($data['postalCode'] ?? '');
        $a->setCountry($data['country'] ?? '');
        $a->setIsDefault((bool)($data['isDefault'] ?? false));

        // 🔥 CLAVE: si esta es default, quitar default a las demás
        if ($a->isDefault()) {
            foreach ($user->getAddresses() as $address) {
                $address->setIsDefault(false);
            }
        }

        $em->persist($a);
        $em->flush();

        return $this->json(['id'=>$a->getId()],201);
    }

    #[Route('/{id}', methods: ['PUT','PATCH'])]
    public function update(Address $address = null, Request $request, EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error'=>'Unauthorized'],401);

        if (!$address || $address->getOwner()->getId() !== $user->getId()) {
            return $this->json(['error'=>'Not found'],404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['street'])) $address->setStreet($data['street']);
        if (isset($data['city'])) $address->setCity($data['city']);
        if (isset($data['state'])) $address->setState($data['state']);
        if (isset($data['postalCode'])) $address->setPostalCode($data['postalCode']);
        if (isset($data['country'])) $address->setCountry($data['country']);

        if (isset($data['isDefault'])) {
            $address->setIsDefault((bool)$data['isDefault']);

            // 🔥 CLAVE: si esta pasa a default, quitar a las demás
            if ($address->isDefault()) {
                foreach ($user->getAddresses() as $userAddress) {
                    if ($userAddress->getId() !== $address->getId()) {
                        $userAddress->setIsDefault(false);
                    }
                }
            }
        }

        $em->flush();

        return $this->json(['message'=>'updated']);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Address $address = null, EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error'=>'Unauthorized'],401);

        if (!$address || $address->getOwner()->getId() !== $user->getId()) {
            return $this->json(['error'=>'Not found'],404);
        }

        $em->remove($address);
        $em->flush();

        return $this->json(['message'=>'deleted']);
    }
}