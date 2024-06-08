import useProductStore from "@/store/productStore";

export const Total = () => {
  const products = useProductStore((state) => state.products);
  const total = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  return (
    <div className=" flex items-center justify-between w-full">
      <h2 className="font-medium flex items-center gap-x-3 ">
        Total: <span className="font-bold text-xl"> ${total.toLocaleString("es-AR")}</span>
      </h2>
      {/* <p className="font-bold">${total.toLocaleString("es-AR")}</p> */}
    </div>
  );
};
