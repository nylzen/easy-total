"use client";

import { useState } from "react";
import { Total } from "../Total/Total";
import { ProductForm } from "../ProductForm/ProductForm";
import { ProductList } from "../ProductList/ProductList";
import { ConfirmModal } from "../Modal/ConfirmModal";
import { Toaster, toast } from "sonner";
import useProductStore from "../../store/productStore";

export const Form = () => {
  const { products, total, clearList, addProduct, updateProductQuantity } = useProductStore();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const generateMessage = () => {
    const date = new Date().toLocaleDateString("es-AR");
    let message = `Lista de productos EasyTotal - ${date}\n\n`;
    products.forEach((product) => {
      message += `${product.name} x ${product.quantity} - $${product.price}\n`;
    });
    message += `\nTotal: $${total.toLocaleString("es-AR")}`;
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
      }
    );
  };

  const handleClearList = () => {
    if (products.length === 0) {
      toast("La lista ya está vacía", { type: "info" });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmClear = () => {
    clearList();
    toast.success("Lista vaciada correctamente");
  };

  return (
    <section className="pb-20 flex flex-col h-screen bg-gray-950 text-gray-50">
      <div className="md:max-w-[800px] container mx-auto px-4 py-8 flex-1 overflow-auto">
        {/* Header con título y botón de vaciar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">EasyTotal</h1>
          {products.length > 0 && (
            <button
              onClick={handleClearList}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
            >
              Vaciar lista
            </button>
          )}
        </div>

        <ProductForm addProduct={addProduct} />
        <ProductList products={products} updateProductQuantity={updateProductQuantity} />
      </div>

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800">
        <div className="md:max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          {/* Total */}
          <div className="flex items-baseline gap-3">
            <span className="text-gray-400">Total:</span>
            <span className="text-2xl font-bold">${total.toLocaleString("es-AR")}</span>
          </div>

          {/* Botón de copiar */}
          {products.length > 0 && (
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copiar lista
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="¿Vaciar lista?"
        message="Esta acción eliminará todos los productos de la lista. ¿Estás seguro?"
      />
      <Toaster position="bottom-center" richColors closeButton />
    </section>
  );
};
