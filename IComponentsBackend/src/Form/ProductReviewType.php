<?php

namespace App\Form;

use App\Entity\Product;
use App\Entity\ProductReview;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ProductReviewType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('rating')
            ->add('title')
            ->add('comment')
            ->add('createdAt', null, [
                'widget' => 'single_text',
            ])
            ->add('owner', EntityType::class, [
                'class' => User::class,
                'choice_label' => 'id',
            ])
            ->add('product', EntityType::class, [
                'class' => Product::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => ProductReview::class,
        ]);
    }
}
