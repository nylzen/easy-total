export const ProductItem = ({ product, onIncrement, onDecrement }) => {
  return (
    <li
      key={product.id}
      className="flex items-center justify-between border-b border-gray-700 pb-4"
    >
      <div className="flex items-center gap-4">
        <p className="font-medium">{product.name}</p>
        <span className="text-gray-400">
          ${product.price && product.price.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onDecrement}
          className="rounded-md bg-gray-800 px-4 py-2"
        >
          -
        </button>
        <span className="font-medium">{product.quantity}</span>
        <button
          onClick={onIncrement}
          className="rounded-md bg-gray-800 px-4 py-2"
        >
          +
        </button>
      </div>
    </li>
  );
};
