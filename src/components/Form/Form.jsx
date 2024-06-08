"use client";

import { useEffect, useRef, useState } from "react";
import { Total } from "../Total/Total";
import { ProductForm } from "../ProductForm/ProductForm";
import { ProductList } from "../ProductList/ProductList";

export const Form = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const calculateTotal = () => {
      if (products.length === 0) {
        return setTotal(0);
      }

      const total = products.reduce((acc, product) => {
        return acc + product.price * product.quantity;
      }, 0);
      setTotal(total);
    };

    calculateTotal();
  }, [products]);

  const addProduct = (product) => {
    setProducts((prevProducts) => [...product, ...prevProducts]);
  };

  const updateProductQuantity = (index, quantity) => {
    const newProducts = [...products];
    if (quantity > 0) {
      newProducts[index].quantity = quantity;
    } else {
      newProducts.splice(index, 1);
    }
    setProducts(newProducts);
  };

  return (
    <section className=" pb-20 flex flex-col h-screen bg-gray-950 text-gray-50">
      <div className="md:max-w-[800px] container mx-auto px-4 py-8 flex-1 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">EasyTotal</h1>
        <ProductForm addProduct={addProduct} nameInputRef={nameInputRef} />
        <ProductList
          products={products}
          updateProductQuantity={updateProductQuantity}
        />
        <Total total={total} />
      </div>
    </section>
  );
};
