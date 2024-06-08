import { create } from "zustand";
import { persist } from "zustand/middleware";

const useProductStore = create(
  persist(
    (set) => ({
      products: [],
      total: 0,
      addProduct: (product) =>
        set((state) => {
          const newProducts = [product, ...state.products];
          const newTotal = newProducts.reduce((acc, product) => {
            return acc + product.price * product.quantity;
          }, 0);
          return { products: newProducts, total: newTotal };
        }),
      updateProductQuantity: (id, quantity) =>
        set((state) => {
          const productToUpdate = state.products.find(
            (product) => product.id === id
          );

          if (!productToUpdate) {
            return state;
          }

          const updatedProduct = { ...productToUpdate, quantity: quantity };

          const newProducts = state.products.map((product) =>
            product.id === id ? updatedProduct : product
          );

          const filteredProducts = newProducts.filter(
            (product) => product.quantity > 0
          );

          return { products: filteredProducts };
        }),
      calculateTotal: () =>
        set((state) => ({
          total: state.products.reduce((acc, product) => {
            return acc + product.price * product.quantity;
          }, 0),
        })),
    }),
    {
      name: "product-store",
    }
  )
);

export default useProductStore;
