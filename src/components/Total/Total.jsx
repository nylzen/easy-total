export const Total = ({ total }) => {
  return (
    <div className="max-w-[800px] mx-auto flex items-center justify-between w-full">
      <h2 className="font-medium flex items-center gap-x-3 ">
        Total: <span className="font-bold text-xl"> ${total.toLocaleString("es-AR")}</span>
      </h2>
      {/* <p className="font-bold">${total.toLocaleString("es-AR")}</p> */}
    </div>
  );
};
