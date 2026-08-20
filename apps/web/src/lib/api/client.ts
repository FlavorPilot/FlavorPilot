import {
  aiExplainResponseSchema,
  dishAnalysisSchema,
  publicDishListResponseSchema,
  dishResponseSchema,
  createDishRequestSchema,
  updateDishRequestSchema,
  remixDishRequestSchema,
  type AiExplainRequest,
  type AiExplainResponse,
  type AnalyzeDishRequest,
  type DishAnalysis,
  type DishResponse,
  type CreateDishRequest,
  type UpdateDishRequest,
  type RemixDishRequest,
  type PublicDishListResponse
} from "@flavorpilot/contracts";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1").replace(/\/$/, "");

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (value: unknown) => T
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | null;

  if (!response.ok) {
    throw new ApiClientError(
      payload?.message ?? `API request failed with status ${response.status}`,
      response.status,
      payload?.code
    );
  }

  return parse(payload);
}

export const analyzeDishOnServer = (input: AnalyzeDishRequest): Promise<DishAnalysis> =>
  request(
    "/flavor/analyze",
    { method: "POST", body: JSON.stringify(input) },
    (value) => dishAnalysisSchema.parse(value)
  );

export const listPublicDishes = (options: {
  cursor?: string;
  limit?: number;
  search?: string;
} = {}): Promise<PublicDishListResponse> => {
  const query = new URLSearchParams();
  if (options.cursor) query.set("cursor", options.cursor);
  if (options.limit) query.set("limit", String(options.limit));
  if (options.search) query.set("search", options.search);
  const suffix = query.size ? `?${query.toString()}` : "";
  return request(
    `/dishes/public${suffix}`,
    { method: "GET" },
    (value) => publicDishListResponseSchema.parse(value)
  );
};

export const explainDishWithAi = (
  input: AiExplainRequest,
  accessToken: string
): Promise<AiExplainResponse> =>
  request(
    "/ai/explain",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    },
    (value) => aiExplainResponseSchema.parse(value)
  );


const authHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`
});

export const listMyDishes = (accessToken: string): Promise<DishResponse[]> =>
  request(
    "/dishes/me",
    { method: "GET", headers: authHeaders(accessToken) },
    (value) => dishResponseSchema.array().parse(value)
  );

export const createDishOnServer = (
  input: CreateDishRequest,
  accessToken: string
): Promise<DishResponse> =>
  request(
    "/dishes",
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(createDishRequestSchema.parse(input))
    },
    (value) => dishResponseSchema.parse(value)
  );

export const updateDishOnServer = (
  id: string,
  input: UpdateDishRequest,
  accessToken: string
): Promise<DishResponse> =>
  request(
    `/dishes/${id}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(updateDishRequestSchema.parse(input))
    },
    (value) => dishResponseSchema.parse(value)
  );

export const remixDishOnServer = (
  id: string,
  input: RemixDishRequest,
  accessToken: string
): Promise<DishResponse> =>
  request(
    `/dishes/${id}/remix`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(remixDishRequestSchema.parse(input))
    },
    (value) => dishResponseSchema.parse(value)
  );

export async function deleteDishOnServer(id: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/dishes/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders(accessToken) }
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; code?: string }
      | null;
    throw new ApiClientError(
      payload?.message ?? `API request failed with status ${response.status}`,
      response.status,
      payload?.code
    );
  }
}
