type RpcResult<T> = { jsonrpc: string; id: number; result: T; error?: never };
type RpcError = { error: { message: string }; result?: never };

export async function deribitPublic<T>(
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("https://www.deribit.com/api/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
    next: { revalidate: 0 },
  });
  const json = (await res.json()) as RpcResult<T> | RpcError;
  if ("error" in json && json.error) {
    throw new Error(json.error.message);
  }
  return (json as RpcResult<T>).result;
}

/** Latest DVOL-style close from Deribit volatility index series (1h resolution). */
export async function fetchDvol(currency: "BTC" | "ETH"): Promise<number | null> {
  const end = Date.now();
  const start = end - 48 * 60 * 60 * 1000;
  type VolPayload = { data: number[][] };
  const payload = await deribitPublic<VolPayload>(
    "public/get_volatility_index_data",
    {
      currency,
      start_timestamp: start,
      end_timestamp: end,
      resolution: "1h",
    },
  );
  const rows = payload.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const last = rows[rows.length - 1];
  const close = last?.[4];
  if (typeof close !== "number") return null;
  return close;
}
