import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AiActor } from './ai-actor';
import { AiAccessService } from './ai-access.service';
export type AiRequest=FastifyRequest&{aiActor:AiActor};
@Injectable()
export class AiAccessGuard implements CanActivate {
 constructor(private readonly access:AiAccessService){}
 async canActivate(context:ExecutionContext){
  const request=context.switchToHttp().getRequest<AiRequest>();
  request.aiActor=(await this.access.resolve(request))!;
  return true;
 }
}
