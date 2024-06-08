"use client";

import { useEffect, useRef, useState } from "react";
import { Total } from "../Total/Total";
import { ProductForm } from "../ProductForm/ProductForm";
import { ProductList } from "../ProductList/ProductList";
import { Toaster, toast } from "sonner";

export const Form = () => {
  const [products, setProducts] = useState(
    JSON.parse(localStorage.getItem("products")) || [],
  );
  const [total, setTotal] = useState(0);
  const nameInputRef = useRef(null);

  const saveToLocalStorage = (products) => {
    localStorage.setItem("products", JSON.stringify(products));
  };

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
    saveToLocalStorage(products);
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

  const generateMessage = () => {
    const date = new Date().toLocaleDateString("es-AR");
    let message = `Lista de productos EasyTotal - ${date}\n\n`;
    products.forEach((product) => {
      message += `${product.name} x ${product.quantity} - $${product.price}\n`;
    });
    message += `\nTotal: $${total.toLocaleString("es-AR")}`;
    console.log(message);
    return message;
  };

  const handleCopyToClipboard = () => {
    const message = generateMessage();
    navigator.clipboard.writeText(message).then(
      () => {
        toast.success("Lista copiada al portapapeles.");
      },
      (err) => {
        toast("Error al copiar el mensaje.", { type: "error" });
        console.error("Error al copiar el mensaje: ", err);
      },
    );
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
        <div className="bg-gray-800 py-6 px-6 flex items-center justify-center absolute w-full bottom-0 left-0">
          <Total total={total} />
          <Toaster position="bottom-center" richColors closeButton/>
          <button
            onClick={handleCopyToClipboard}
            className="bg-green-500 text-white px-4 py-2 rounded-md"
          >
            Copiar
          </button>
        </div>
      </div>
    </section>
  );
};
