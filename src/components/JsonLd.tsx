export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const graph = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
  return (
    <script
      type="application/ld+json"
      // JSON-LDは信頼できるサーバー側生成データのみを渡す想定（ユーザー入力を直接埋め込まない）。
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
