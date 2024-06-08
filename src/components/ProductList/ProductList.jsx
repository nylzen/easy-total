import useProductStore from "@/store/productStore";
import { ProductItem } from "../ProductItem/ProductItem";

export const ProductList = () => {
  const products = useProductStore((state) => state.products);


  return (
    <ul className="grid gap-4">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}

        />
      ))}
    </ul>
  );
};
