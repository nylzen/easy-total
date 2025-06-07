import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

// Cache simple para evitar requests repetidos
const categorizationCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Límite diario de categorizaciones
const DAILY_LIMIT = 15;
const DAILY_LIMIT_KEY = "gemini_daily_usage";

// Límite de tokens por request (aproximado)
const MAX_TOKENS_PER_REQUEST = 1000;
const ESTIMATED_TOKENS_PER_PRODUCT = 10; // Nombre promedio + overhead

// Timeout para requests
const REQUEST_TIMEOUT = 30000; // 30 segundos

// Funciones para manejar límite diario
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
    // Verificar que existe la API key
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      toast.error("API key de Gemini no configurada");
      throw new Error("API key no configurada");
    }

    // Verificar límite diario
    const dailyCheck = checkDailyLimit();
    if (!dailyCheck.canUse) {
      toast.error(
        `Límite diario alcanzado (${DAILY_LIMIT} categorizaciones). Intenta mañana.`
      );
      throw new Error("Límite diario alcanzado");
    }

    // Límite de seguridad: máximo 50 productos por request
    if (products.length > 50) {
      toast.error("Máximo 50 productos por categorización");
      throw new Error("Demasiados productos para categorizar");
    }

    // Validar nombres de productos
    const invalidProducts = products.filter(p =>
      !p.name ||
      typeof p.name !== 'string' ||
      p.name.trim().length === 0 ||
      p.name.length > 100 || // Nombres muy largos
      /[<>{}[\]\\]/.test(p.name) // Caracteres sospechosos
    );

    if (invalidProducts.length > 0) {
      toast.error("Algunos productos tienen nombres inválidos");
      throw new Error("Nombres de productos inválidos");
    }

    // Verificar límite de tokens estimado
    const estimatedTokens = products.length * ESTIMATED_TOKENS_PER_PRODUCT + 200; // +200 para prompt base
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST) {
      const maxProducts = Math.floor((MAX_TOKENS_PER_REQUEST - 200) / ESTIMATED_TOKENS_PER_PRODUCT);
      toast.error(`Demasiados productos. Máximo ${maxProducts} por categorización.`);
      throw new Error("Límite de tokens excedido");
    }

    // Crear clave de cache basada en los nombres de productos
    const productNames = products.map((p) => p.name).join(", ");
    const cacheKey = productNames.toLowerCase().trim();

    // Verificar cache
    const cached = categorizationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Usando resultado desde cache");
      return cached.data;
    }

    const prompt = `
Vas a prestar atención a los nombres de los productos y categorízalos en las siguientes categorías principales:
- Frutas y Verduras
- Carnes y Pescados
- Lácteos y Huevos
- Despensa
- Panadería
- Bebidas
- Limpieza y Hogar
- Cuidado Personal
- Congelados
- Conservas y Enlatados
- Snacks y Dulces
- Mascotas
- Otros

Productos: ${productNames}

Si el producto tiene un nombre que no se ajusta a ninguna categoría, crea una nueva categoría para ese producto. Por ejemplo, si el producto es "Coca Cola o Coca", lo categorizas como "Bebidas". Si es "Yerba" lo categorizas como "Despensa".

Responde ÚNICAMENTE con un objeto JSON válido en el siguiente formato, sin texto adicional:
{
  "categorizedProducts": [
    {
      "name": "nombre_del_producto",
      "category": "categoría_asignada"
    }
  ]
}
`;

    // Crear promise con timeout
    const requestPromise = genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT)
    );

    const response = await Promise.race([requestPromise, timeoutPromise]);

    const text = response.text;

    // Intentar parsear la respuesta JSON
    try {
      // Limpiar la respuesta si viene con markdown
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsedResponse = JSON.parse(cleanText);
      const result = parsedResponse.categorizedProducts || [];

      // Guardar en cache
      categorizationCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      // Incrementar contador diario solo si fue exitoso
      incrementDailyUsage();

      // Log para monitoreo (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Categorización exitosa: ${products.length} productos, ${result.length} categorizados`);
      }

      return result;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      toast.error("Error al categorizar productos");
      // console.log("Raw response:", text);
      // Si falla el parsing, devolver productos sin categorizar
      return products.map((p) => ({ name: p.name, category: "Otros" }));
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    toast.error("Error al categorizar productos");
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
      ).toFixed(2)}\n`;
    });
    message += "\n";
  });

  const total = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  message += `💰 Total General: $${total.toLocaleString("es-AR")}`;

  return message;
};

// Exportar función para verificar límite diario
export const getDailyLimitStatus = () => {
  return checkDailyLimit();
};

// Función para verificar salud del sistema
export const getSystemHealth = () => {
  const dailyStatus = checkDailyLimit();
  const cacheSize = categorizationCache.size;

  return {
    apiKeyConfigured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    dailyLimit: {
      used: dailyStatus.used,
      remaining: dailyStatus.remaining,
      total: DAILY_LIMIT
    },
    cache: {
      entries: cacheSize,
      maxRecommended: 100
    },
    limits: {
      maxProductsPerRequest: 50,
      maxTokensPerRequest: MAX_TOKENS_PER_REQUEST,
      requestTimeout: REQUEST_TIMEOUT / 1000 + 's'
    }
  };
};
