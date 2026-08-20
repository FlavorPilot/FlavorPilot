import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  aiExplainResponseSchema,
  type AiExplainRequest,
  type AiExplainResponse
} from "@tastecraft/contracts";

const outputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    main_problem: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["title", "explanation"],
        additionalProperties: false
      }
    }
  },
  required: ["summary", "main_problem", "actions"],
  additionalProperties: false
} as const;

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async explain(input: AiExplainRequest): Promise<AiExplainResponse> {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: "OPENAI_NOT_CONFIGURED",
        message: "Set OPENAI_API_KEY to enable the optional explanation layer"
      });
    }

    const language = input.locale === "uk" ? "Ukrainian" : "English";
    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.config.get<string>("OPENAI_MODEL", "gpt-5-mini"),
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text:
                    `You are the narrative layer of a culinary analysis product. Reply in ${language}. ` +
                    "Never alter, recalculate or invent numerical scores. Explain only the deterministic Flavor Engine output supplied by the application. " +
                    "Be practical, concise, explicit about quantities, and do not claim sensory certainty beyond the supplied confidence score."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(input)
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "dish_explanation",
              strict: true,
              schema: outputSchema
            }
          }
        }),
        signal: AbortSignal.timeout(30_000)
      });
    } catch {
      throw new BadGatewayException({
        code: "OPENAI_UNREACHABLE",
        message: "The AI explanation provider could not be reached"
      });
    }

    if (!response.ok) {
      const providerRequestId = response.headers.get("x-request-id");
      throw new BadGatewayException({
        code: "OPENAI_REQUEST_FAILED",
        message: "The AI explanation provider rejected the request",
        details: providerRequestId ? { providerRequestId } : undefined
      });
    }

    let data: OpenAIResponse;
    try {
      data = (await response.json()) as OpenAIResponse;
    } catch {
      throw new BadGatewayException({
        code: "OPENAI_INVALID_RESPONSE",
        message: "The AI explanation provider returned invalid JSON"
      });
    }

    const outputText = data.output_text ?? data.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;

    if (!outputText) {
      throw new BadGatewayException({
        code: "OPENAI_EMPTY_RESPONSE",
        message: "The AI explanation provider returned no structured output"
      });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(outputText);
    } catch {
      throw new BadGatewayException({
        code: "OPENAI_INVALID_JSON",
        message: "The AI explanation provider returned invalid JSON"
      });
    }

    const parsed = aiExplainResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new BadGatewayException({
        code: "OPENAI_SCHEMA_MISMATCH",
        message: "The AI explanation did not match the required response schema"
      });
    }

    return parsed.data;
  }
}
