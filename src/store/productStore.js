import { create } from "zustand";
import { persist } from "zustand/middleware";

const useProductStore = create(
  persist(
    (set) => ({
      products: [],
      total: 0,
      addProduct: (product) =>
        set((state) => {
          const products = [product, ...state.products];
          const total = products.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0
          );
          return { products, total };
        }),
      updateProductQuantity: (id, quantity) =>
        set((state) => {
          const products = state.products.map((product) =>
            product.id === id ? { ...product, quantity } : product
          );
          const total = products.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0
          );
          return { products, total };
        }),
      updateProduct: (id, updatedProduct) =>
        set((state) => {
          const products = state.products.map((product) =>
            product.id === id ? { ...product, ...updatedProduct } : product
          );
          const total = products.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0
          );
          return { products, total };
        }),
      deleteProduct: (id) =>
        set((state) => {
          const products = state.products.filter((product) => product.id !== id);
          const total = products.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0
          );
          return { products, total };
        }),
      clearList: () =>
        set(() => ({
          products: [],
          total: 0,
        })),
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
