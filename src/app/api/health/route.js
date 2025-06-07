import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY
      ? process.env.GEMINI_API_KEY.length
      : 0;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasApiKey,
      apiKeyLength,
      // Solo mostrar los primeros y últimos caracteres para seguridad
      apiKeyPreview: hasApiKey
        ? `${process.env.GEMINI_API_KEY.substring(
            0,
            8
          )}...${process.env.GEMINI_API_KEY.substring(apiKeyLength - 8)}`
        : null,
    });
  } catch (error) {
    console.error("Error in health check:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
