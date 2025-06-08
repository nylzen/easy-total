"use client";

import { useState } from "react";
import { Total } from "../Total/Total";
import { ProductForm } from "../ProductForm/ProductForm";
import { ProductList } from "../ProductList/ProductList";
import { ConfirmModal } from "../Modal/ConfirmModal";
import { CategoryModal } from "../Modal/CategoryModal";
import { Toaster, toast } from "sonner";
import useProductStore from "../../store/productStore";
import {
  categorizeProducts,
  generateCategorizedMessage,
  getDailyLimitStatus,
} from "../../services/geminiService";

export const Form = () => {
  const { products, total, clearList, addProduct, updateProductQuantity } =
    useProductStore();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategorizingProducts, setIsCategorizingProducts] = useState(false);
  const [lastCategorizationTime, setLastCategorizationTime] = useState(0);

  // Rate limit: máximo 1 categorización cada 10 segundos
  const RATE_LIMIT_MS = 10000;

  // Función auxiliar para copiar al portapapeles con fallback para móviles
  const copyToClipboard = async (text) => {
    try {
      // Intentar usar la API moderna del portapapeles
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores móviles o contextos no seguros
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
      return false;
    }
  };

  // Función auxiliar para abrir WhatsApp con manejo de errores
  const openWhatsApp = (message) => {
    try {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      // Verificar si estamos en móvil
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        // En móvil, usar window.location para mejor compatibilidad
        window.location.href = whatsappUrl;
      } else {
        // En desktop, usar window.open
        window.open(whatsappUrl, "_blank");
      }
      return true;
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      return false;
    }
  };

  const generateMessage = () => {
    const date = new Date().toLocaleDateString("es-AR");
    let message = `Lista de productos EasyTotal - ${date}\n\n`;
    products.forEach((product) => {
      message += `${product.name} x ${product.quantity} - $${product.price}\n`;
    });
    message += `\nTotal: $${total.toLocaleString("es-AR")}`;
    return message;
  };

  const handleOpenCategoryModal = () => {
    if (products.length === 0) {
      toast("No hay productos para compartir", { type: "info" });
      return;
    }

    // Verificar límite diario
    const dailyStatus = getDailyLimitStatus();
    if (!dailyStatus.canUse) {
      toast.error(
        `Límite diario alcanzado (15 categorizaciones). Intenta mañana.`
      );
      return;
    }

    // Verificar rate limit
    const now = Date.now();
    const timeSinceLastCall = now - lastCategorizationTime;

    if (timeSinceLastCall < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil(
        (RATE_LIMIT_MS - timeSinceLastCall) / 1000
      );
      toast.error(
        `Espera ${remainingTime} segundos antes de categorizar nuevamente`
      );
      return;
    }

    setIsCategoryModalOpen(true);
  };

  const handleConfirmWithAI = async () => {
    setIsCategorizingProducts(true);
    setLastCategorizationTime(Date.now());

    try {
      // Categorizar productos con Gemini
      const categorizedData = await categorizeProducts(products);
      console.log("Categorized data received:", categorizedData);

      // Generar mensaje categorizado
      const categorizedMessage = generateCategorizedMessage(
        products,
        categorizedData
      );
      console.log("Generated categorized message:", categorizedMessage);

      // Intentar copiar al portapapeles
      const copySuccess = await copyToClipboard(categorizedMessage);

      // Intentar abrir WhatsApp
      const whatsappSuccess = openWhatsApp(categorizedMessage);

      setIsCategoryModalOpen(false);

      if (copySuccess && whatsappSuccess) {
        toast.success(
          "Lista categorizada, copiada al portapapeles y compartida a WhatsApp 🎉"
        );
      } else if (whatsappSuccess) {
        toast.success("Lista categorizada y compartida a WhatsApp 📱");
      } else if (copySuccess) {
        toast.success("Lista categorizada y copiada al portapapeles 📋");
      } else {
        toast.error("Error al compartir. Intenta copiar manualmente.");
      }
    } catch (error) {
      console.error("Error al categorizar productos:", error);

      // Fallback: compartir sin categorizar
      const message = generateMessage();

      try {
        const copySuccess = await copyToClipboard(message);
        const whatsappSuccess = openWhatsApp(message);

        setIsCategoryModalOpen(false);

        if (copySuccess && whatsappSuccess) {
          toast.success(
            "Lista copiada al portapapeles y compartida a WhatsApp (sin categorizar)"
          );
        } else if (whatsappSuccess) {
          toast.success("Lista compartida a WhatsApp (sin categorizar) 📱");
        } else if (copySuccess) {
          toast.success("Lista copiada al portapapeles (sin categorizar) 📋");
        } else {
          toast.error("Error al compartir. Intenta copiar manualmente.");
        }
      } catch (shareError) {
        setIsCategoryModalOpen(false);
        toast.error("Error al compartir el mensaje");
        console.error("Error al compartir el mensaje: ", shareError);
      }
    } finally {
      setIsCategorizingProducts(false);
    }
  };

  const handleConfirmWithoutAI = async () => {
    try {
      // Generar mensaje simple sin categorizar
      const message = generateMessage();

      // Intentar copiar al portapapeles
      const copySuccess = await copyToClipboard(message);

      // Intentar abrir WhatsApp
      const whatsappSuccess = openWhatsApp(message);

      setIsCategoryModalOpen(false);

      if (copySuccess && whatsappSuccess) {
        toast.success(
          "Lista copiada al portapapeles y compartida a WhatsApp 📱"
        );
      } else if (whatsappSuccess) {
        toast.success("Lista compartida a WhatsApp 📱");
      } else if (copySuccess) {
        toast.success("Lista copiada al portapapeles 📋");
      } else {
        toast.error("Error al compartir. Intenta copiar manualmente.");
      }
    } catch (error) {
      setIsCategoryModalOpen(false);
      toast.error("Error al compartir el mensaje");
      console.error("Error al compartir el mensaje: ", error);
    }
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
          <h1 className="text-2xl font-bold">Mi Chango</h1>
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
        <ProductList
          products={products}
          updateProductQuantity={updateProductQuantity}
        />
      </div>

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800">
        <div className="md:max-w-[800px] mx-auto px-4 py-3 md:py-4">
          {/* Layout responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            {/* Total */}
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-gray-400 text-sm sm:text-base">Total:</span>
              <span className="text-xl sm:text-2xl font-bold">
                ${total.toLocaleString("es-AR")}
              </span>
            </div>

            {/* Botón de compartir */}
            {products.length > 0 && (
              <button
                onClick={handleOpenCategoryModal}
                disabled={isCategorizingProducts}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {isCategorizingProducts ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="animate-pulse">Categorizando...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    <span className="hidden xs:inline">
                      Compartir a WhatsApp
                    </span>
                    <span className="xs:hidden">WhatsApp</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="¿Vaciar lista?"
        message="Esta acción eliminará todos los productos de la lista. ¿Estás seguro?"
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onConfirmWithAI={handleConfirmWithAI}
        onConfirmWithoutAI={handleConfirmWithoutAI}
        productCount={products.length}
        isLoading={isCategorizingProducts}
      />

      <Toaster position="bottom-center" richColors closeButton />
    </section>
  );
};
