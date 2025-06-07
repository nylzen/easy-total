import { toast } from "sonner";

// Límite diario de categorizaciones (solo para UI feedback)
const DAILY_LIMIT = 15;
const DAILY_LIMIT_KEY = "gemini_daily_usage";

// Funciones para manejar límite diario (solo para UI)
const getDailyUsage = () => {
  try {
    const stored = localStorage.getItem(DAILY_LIMIT_KEY);
    if (!stored) return { count: 0, date: new Date().toDateString() };

    const usage = JSON.parse(stored);
    const today = new Date().toDateString();

    // Si es un nuevo día, resetear contador
    if (usage.date !== today) {
      return { count: 0, date: today };
    }

    return usage;
  } catch (error) {
    console.error("Error reading daily usage:", error);
    return { count: 0, date: new Date().toDateString() };
  }
};

const incrementDailyUsage = () => {
  try {
    const usage = getDailyUsage();
    const newUsage = {
      count: usage.count + 1,
      date: usage.date,
    };
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(newUsage));
    return newUsage;
  } catch (error) {
    console.error("Error updating daily usage:", error);
    return null;
  }
};

const checkDailyLimit = () => {
  const usage = getDailyUsage();
  return {
    canUse: usage.count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
    used: usage.count,
  };
};

export const categorizeProducts = async (products) => {
  try {
    // Verificar límite diario local (para UX)
    const dailyCheck = checkDailyLimit();
    if (!dailyCheck.canUse) {
      toast.error(
        `Límite diario alcanzado (${DAILY_LIMIT} categorizaciones). Intenta mañana.`
      );
      throw new Error("Límite diario alcanzado");
    }

    // Llamar a la API route segura
    const response = await fetch('/api/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 429) {
        toast.error(errorData.error);
        throw new Error("Rate limit exceeded");
      }

      toast.error(errorData.error || "Error al categorizar productos");
      throw new Error(errorData.error || "API error");
    }

    const data = await response.json();

    // Incrementar contador local para UI feedback
    incrementDailyUsage();

    return data.categorizedProducts || [];

  } catch (error) {
    console.error("Error calling categorization API:", error);

    if (error.message !== "Rate limit exceeded") {
      toast.error("Error al categorizar productos");
    }

    // En caso de error, devolver productos sin categorizar
    return products.map((p) => ({ name: p.name, category: "Otros" }));
  }
};

export const generateCategorizedMessage = (products, categorizedData) => {
  const date = new Date().toLocaleDateString("es-AR");

  // Crear un mapa de productos categorizados (comparación case-insensitive y trimmed)
  const categoryMap = {};
  // biome-ignore lint/complexity/noForEach: <explanation>
  categorizedData.forEach((item) => {
    const normalizedName = item.name.toLowerCase().trim();
    categoryMap[normalizedName] = item.category;
  });

  // Agrupar productos por categoría
  const productsByCategory = {};
  // biome-ignore lint/complexity/noForEach: <explanation>
  products.forEach((product) => {
    const normalizedProductName = product.name.toLowerCase().trim();
    const category = categoryMap[normalizedProductName] || "Otros";

    if (!productsByCategory[category]) {
      productsByCategory[category] = [];
    }
    productsByCategory[category].push(product);
  });

  // Generar el mensaje categorizado
  let message = `Lista de productos - ${date}\n\n`;

  // Ordenar categorías alfabéticamente
  const sortedCategories = Object.keys(productsByCategory).sort();

  // biome-ignore lint/complexity/noForEach: <explanation>
  sortedCategories.forEach((category) => {
    // Calcular total de la categoría
    const categoryTotal = productsByCategory[category].reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    message += `📁 ${category} - $${categoryTotal.toLocaleString("es-AR")}\n`;
    productsByCategory[category].forEach((product) => {
      message += `  • ${product.name} x ${product.quantity} - $${(
        product.price * product.quantity
      ).toLocaleString("es-AR")}\n`;
    });
    message += "\n";
  });

  // Calcular total general
  const totalGeneral = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  message += `💰 Total General: $${totalGeneral.toLocaleString("es-AR")}`;

  return message;
};

// Función para obtener el estado del límite diario (para mostrar en UI)
export const getDailyLimitStatus = () => {
  return checkDailyLimit();
};

// Función para verificar el estado del sistema
export const getSystemHealth = () => {
  return {
    status: "ok",
    dailyLimit: getDailyLimitStatus(),
    timestamp: new Date().toISOString(),
  };
};
