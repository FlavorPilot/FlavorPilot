// Provider messages can echo secrets or recipe content. Log fixed labels and bounded IDs only.
export function providerDiagnostic(stage:'input_tokens'|'responses',status:number,body:unknown,requestId:string|null=null){
 const error=body&&typeof body==='object'&&'error' in body?body.error:null;
 const value=error&&typeof error==='object'?error as Record<string,unknown>:{};
 const knownCodes=['invalid_api_key','insufficient_quota','rate_limit_exceeded','model_not_found','permission_denied','insufficient_permissions','invalid_request_error','unsupported_value','unsupported_parameter','invalid_json_schema','billing_hard_limit_reached','billing_not_active'];
 const knownParams=['model','reasoning','reasoning.effort','text','text.format','text.format.schema','input','max_output_tokens'];
 const code=knownCodes.find(code=>code===value.code)??'unclassified';
 const param=knownParams.find(param=>param===value.param)??'unspecified';
 const missingScope=typeof value.message==='string'&&/missing scopes?:/i.test(value.message);
 const projectId=code==='model_not_found'&&typeof value.message==='string'
  ? /^Project [`'"]?(proj_[A-Za-z0-9]{1,80})[`'"]? does not have access to model\b/.exec(value.message)?.[1]:undefined;
 const safeRequestId=requestId&&/^req_[A-Za-z0-9]{1,100}$/.test(requestId)?requestId:null;
 return `OpenAI rejected ${stage}: status=${status} code=${code} param=${param} missingScope=${missingScope}${projectId?` projectId=${projectId}`:''}${safeRequestId?` requestId=${safeRequestId}`:''}`;
}
