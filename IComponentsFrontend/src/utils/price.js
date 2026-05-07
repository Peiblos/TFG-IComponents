export const getDiscountedPrice = (price, discount) => {
  const numericPrice = Number(price);
  const numericDiscount = Number(discount);

  if (!numericDiscount || numericDiscount <= 0) return numericPrice;

  return numericPrice - numericPrice * (numericDiscount / 100);
};

export const formatPrice = (price) => {
  return `${Number(price).toFixed(2)}€`;
};

export const hasDiscount = (discount) => {
  return Number(discount) > 0;
};