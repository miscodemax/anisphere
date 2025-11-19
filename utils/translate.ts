// utils/translate.ts
export async function translateText(text: string, target_lang = "FR") {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target_lang }),
    });

    const data = await res.json();
    return data.translated || text;
  } catch (err) {
    console.error(err);
    return text;
  }
}
