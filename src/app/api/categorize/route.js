import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Configuración segura en el servidor
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY); // Sin NEXT_PUBLIC_

// Límites de seguridad
const MAX_PRODUCTS = 50;
const MAX_TOKENS_PER_REQUEST = 1000;
const ESTIMATED_TOKENS_PER_PRODUCT = 10;
const REQUEST_TIMEOUT = 30000;

// Cache en memoria del servidor (se podría usar Redis en producción)
const serverCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Rate limiting simple por IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 segundos
const DAILY_LIMIT = 15;

function getRateLimitKey(request) {
  // En producción, usar IP real
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  return ip;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimits = rateLimitMap.get(ip) || {
    lastRequest: 0,
    dailyCount: 0,
    dailyReset: now,
  };

  // Reset diario
  if (now - userLimits.dailyReset > 24 * 60 * 60 * 1000) {
    userLimits.dailyCount = 0;
    userLimits.dailyReset = now;
  }

  // Verificar límite diario
  if (userLimits.dailyCount >= DAILY_LIMIT) {
    return { allowed: false, reason: "daily_limit" };
  }

  // Verificar rate limit
  if (now - userLimits.lastRequest < RATE_LIMIT_WINDOW) {
    return { allowed: false, reason: "rate_limit" };
  }

  return { allowed: true };
}

function updateRateLimit(ip) {
  const now = Date.now();
  const userLimits = rateLimitMap.get(ip) || {
    lastRequest: 0,
    dailyCount: 0,
    dailyReset: now,
  };

  userLimits.lastRequest = now;
  userLimits.dailyCount += 1;

  rateLimitMap.set(ip, userLimits);
}

export async function POST(request) {
  try {
    // Verificar API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key no configurada" },
        { status: 500 }
      );
    }

    // Rate limiting
    const ip = getRateLimitKey(request);
    const rateLimitCheck = checkRateLimit(ip);

    if (!rateLimitCheck.allowed) {
      const message =
        rateLimitCheck.reason === "daily_limit"
          ? "Límite diario alcanzado (15 categorizaciones)"
          : "Demasiadas solicitudes. Espera 10 segundos.";

      return NextResponse.json({ error: message }, { status: 429 });
    }

    // Parsear body
    const { products } = await request.json();

    // Validaciones
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Productos inválidos" },
        { status: 400 }
      );
    }

    if (products.length > MAX_PRODUCTS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_PRODUCTS} productos por categorización` },
        { status: 400 }
      );
    }

    // Validar nombres de productos
    const invalidProducts = products.filter(
      (p) =>
        !p.name ||
        typeof p.name !== "string" ||
        p.name.trim().length === 0 ||
        p.name.length > 100 ||
        /[<>{}[\]\\]/.test(p.name)
    );

    if (invalidProducts.length > 0) {
      return NextResponse.json(
        { error: "Algunos productos tienen nombres inválidos" },
        { status: 400 }
      );
    }

    // Verificar límite de tokens
    const estimatedTokens =
      products.length * ESTIMATED_TOKENS_PER_PRODUCT + 200;
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST) {
      const maxProducts = Math.floor(
        (MAX_TOKENS_PER_REQUEST - 200) / ESTIMATED_TOKENS_PER_PRODUCT
      );
      return NextResponse.json(
        {
          error: `Demasiados productos. Máximo ${maxProducts} por categorización.`,
        },
        { status: 400 }
      );
    }

    // Verificar cache
    const productNames = products.map((p) => p.name).join(", ");
    const cacheKey = productNames.toLowerCase().trim();
    const cached = serverCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Usando resultado desde cache del servidor");
      return NextResponse.json({ categorizedProducts: cached.data });
    }

    // Crear prompt
    const prompt = `
Analiza la siguiente lista de productos de supermercado y categorízalos en las siguientes categorías principales:
- Frutas y Verduras
- Carnes y Pescados
- Lácteos y Huevos
- Panadería
- Bebidas
- Limpieza y Hogar
- Cuidado Personal
- Congelados
- Conservas y Enlatados
- Snacks y Dulces
- Otros

Productos: ${productNames}

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

    // Llamar a Gemini con timeout
    const requestPromise = genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT)
    );

    const response = await Promise.race([requestPromise, timeoutPromise]);
    const text = response.text;

    // Parsear respuesta
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsedResponse = JSON.parse(cleanText);
    const result = parsedResponse.categorizedProducts || [];

    // Guardar en cache
    serverCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Actualizar rate limit
    updateRateLimit(ip);

    // Log para monitoreo
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ Categorización exitosa: ${products.length} productos, ${result.length} categorizados`
      );
    }

    return NextResponse.json({ categorizedProducts: result });
  } catch (error) {
    console.error("Error en categorización:", error);

    if (error.message === "Request timeout") {
      return NextResponse.json(
        { error: "Timeout: La categorización tardó demasiado" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
