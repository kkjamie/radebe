export interface RenderRequest {
  source: string;
}

export interface RenderResult {
  output: string;
  diagnostics: string[];
}

export function renderDocument(request: RenderRequest): RenderResult {
  return {
    output: request.source,
    diagnostics: []
  };
}
