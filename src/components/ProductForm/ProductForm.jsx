"use client";
import React, { useState } from "react";

export const ProductForm = ({ addProduct }) => {
  const [newProduct, setNewProduct] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.trim() || !price.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError("El precio debe ser un número mayor a 0");
      return;
    }

    addProduct({
      id: Date.now(),
      name: newProduct,
      price: Number(price),
      quantity: 1,
    });
    setNewProduct("");
    setPrice("");
    setError("");
  };

  return (
    <>
      <form className="grid grid-cols-2 gap-4 mb-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Producto"
          className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 rounded-md py-2 px-4 border"
          onChange={(e) => setNewProduct(e.target.value)}
          value={newProduct}
        />
        <input
          type="tel"
          placeholder="Precio"
          className="bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 rounded-md py-2 px-4 border"
          onChange={(e) => setPrice(e.target.value)}
          value={price}
        />
        <button
          type="submit"
          className="col-span-2 flex items-center justify-center bg-gray-800 border-gray-700 border py-2 rounded-md"
        >
          + Agregar
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </>
  );
};
