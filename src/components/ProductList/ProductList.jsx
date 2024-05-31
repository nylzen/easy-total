import { ProductItem } from "../ProductItem/ProductItem";

export const ProductList = ({ products, updateProductQuantity }) => {
  return (
    <ul className="grid gap-4">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}
          onIncrement={() => updateProductQuantity(index, product.quantity + 1)}
          onDecrement={() => updateProductQuantity(index, product.quantity - 1)}
        />
      ))}
    </ul>
  );
};
