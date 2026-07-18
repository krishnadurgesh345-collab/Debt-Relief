// Augmenting the Express global namespace is the correct way to extend Request
// for ALL generic instantiations (Request<ParamsDictionary, ...> etc.)
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
      };
    }
  }
}
