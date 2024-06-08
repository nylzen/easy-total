export const Total = ({ total }) => {
  return (
    <div className="bg-gray-800 py-6 px-6 flex items-center justify-between absolute w-full bottom-0 left-0">
      <div className="max-w-[800px] mx-auto flex items-center justify-between w-full">
        <h2 className="font-meidum">Total</h2>
        <p className="font-bold">${total.toLocaleString('es-AR')}</p>
      </div>
    </div>
  );
};
