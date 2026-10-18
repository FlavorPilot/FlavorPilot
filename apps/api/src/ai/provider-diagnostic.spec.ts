import {describe,expect,it} from 'vitest';
import {providerDiagnostic} from './provider-diagnostic';
describe('safe provider diagnostics',()=>{
 it('reports actionable labels without provider messages or arbitrary fields',()=>{
  const result=providerDiagnostic('input_tokens',403,{error:{code:'permission_denied',param:'model',message:'Missing scopes: api.responses.write; secret sk-private and private recipe',other:'sensitive'}});
  expect(result).toBe('OpenAI rejected input_tokens: status=403 code=permission_denied param=model missingScope=true');
  expect(result).not.toContain('sk-private');expect(result).not.toContain('recipe');
 });
 it('does not interpolate arbitrary codes or params, and handles non-JSON error bodies',()=>{
  expect(providerDiagnostic('responses',400,{error:{code:'sk-private',param:'private recipe'}})).toBe('OpenAI rejected responses: status=400 code=unclassified param=unspecified missingScope=false');
  expect(providerDiagnostic('responses',502,null)).toContain('code=unclassified');
 });
});
