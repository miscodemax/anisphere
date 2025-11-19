// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, target_lang } = await req.json();
    if (!text || !target_lang) {
      return NextResponse.json(
        { error: "Text and target_lang required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text, target_lang }),
    });

    const data = await response.json();
    const translated = data.translations?.[0]?.text || text;

    return NextResponse.json({ translated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
