import useProductStore from "@/store/productStore";
import { ProductItem } from "../ProductItem/ProductItem";

export const ProductList = () => {
  const products = useProductStore((state) => state.products);

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay productos agregados
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
};
