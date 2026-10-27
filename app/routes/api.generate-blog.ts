import type { ActionFunctionArgs } from "react-router";
import { generateBlogWithGemini } from "~/services/geminiBlogService";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const topic = body?.topic;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return Response.json(
        { error: "Please provide a blog topic or theme." },
        { status: 400 }
      );
    }

    const blog = await generateBlogWithGemini({
      topic: topic.trim(),
      tone: body.tone,
      category: body.category,
      targetLength: body.targetLength,
      focusKeywords: body.focusKeywords,
      apiKey: body.apiKey,
    });

    return Response.json({ success: true, blog });
  } catch (error: any) {
    console.error("Error generating blog with Gemini:", error);
    return Response.json(
      {
        error:
          error?.message ||
          "Failed to generate blog with Gemini. Please verify your API key and connection.",
      },
      { status: 500 }
    );
  }
}
