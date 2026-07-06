import type { RequestHandler } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

type AsyncRequestHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> = (
  req: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>[0],
  res: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>[1],
  next: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>[2],
) => Promise<void>;

export function asyncHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
>(handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
