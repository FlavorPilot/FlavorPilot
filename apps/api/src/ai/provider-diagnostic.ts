// Provider error messages can echo credentials or recipe content. Only fixed labels enter logs.
export function providerDiagnostic(stage:'input_tokens'|'responses',status:number,body:unknown){
 const error=body&&typeof body==='object'&&'error' in body?body.error:null;
 const value=error&&typeof error==='object'?error as Record<string,unknown>:{};
 const knownCodes=['invalid_api_key','insufficient_quota','rate_limit_exceeded','model_not_found','permission_denied','insufficient_permissions','invalid_request_error','unsupported_value','unsupported_parameter','invalid_json_schema','billing_hard_limit_reached','billing_not_active'];
 const knownParams=['model','reasoning','reasoning.effort','text','text.format','text.format.schema','input','max_output_tokens'];
 const code=knownCodes.find(code=>code===value.code)??'unclassified';
 const param=knownParams.find(param=>param===value.param)??'unspecified';
 const missingScope=typeof value.message==='string'&&/missing scopes?:/i.test(value.message);
 return `OpenAI rejected ${stage}: status=${status} code=${code} param=${param} missingScope=${missingScope}`;
}
