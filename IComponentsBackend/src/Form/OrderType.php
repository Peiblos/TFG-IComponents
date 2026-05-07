<?php

namespace App\Form;

use App\Entity\Address;
use App\Entity\Order;
use App\Entity\Payment;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class OrderType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('createdAt', null, [
                'widget' => 'single_text',
            ])
            ->add('status')
            ->add('total')
            ->add('owner', EntityType::class, [
                'class' => User::class,
                'choice_label' => 'id',
            ])
            ->add('shippingAddress', EntityType::class, [
                'class' => Address::class,
                'choice_label' => 'id',
            ])
            ->add('payment', EntityType::class, [
                'class' => Payment::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Order::class,
        ]);
    }
}
