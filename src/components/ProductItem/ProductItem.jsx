import { useState } from "react";
import useProductStore from "@/store/productStore";

export const ProductItem = ({ product }) => {
  const { updateProductQuantity, updateProduct, deleteProduct } = useProductStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product);

  const onIncrement = () => {
    updateProductQuantity(product.id, product.quantity + 1);
  };

  const onDecrement = () => {
    if (product.quantity > 1) {
      updateProductQuantity(product.id, product.quantity - 1);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedProduct.name.trim() === "" || editedProduct.price <= 0 || editedProduct.quantity <= 0) {
      return;
    }
    updateProduct(product.id, editedProduct);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct(product);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteProduct(product.id);
  };

  const totalPrice = product.price * product.quantity;

  if (isEditing) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
              placeholder="Nombre del producto"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Precio unitario</label>
                <input
                  type="number"
                  value={editedProduct.price}
                  onChange={(e) => setEditedProduct({ ...editedProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
                  placeholder="Precio"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={editedProduct.quantity}
                  onChange={(e) => setEditedProduct({ ...editedProduct, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
                  placeholder="Cantidad"
                  min="1"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex flex-col gap-3">
        {/* Información del producto y acciones */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">
              {product.name}
            </h3>
            <p className="text-sm text-gray-400">
              Precio unitario: ${product.price.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
              aria-label="Editar producto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
              aria-label="Eliminar producto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Controles de cantidad y total */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={onDecrement}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/50 hover:bg-gray-600 text-gray-200 transition-colors"
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span className="w-12 text-center font-medium text-white">
              {product.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-700/50 hover:bg-gray-600 text-gray-200 transition-colors"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-lg font-semibold text-white">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
