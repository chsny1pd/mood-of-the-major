declare module "passport-github2" {
  import type passport from "passport";

  export class Strategy extends passport.Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[];
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: passport.Profile,
        done: (error: Error | null, user?: passport.Profile) => void,
      ) => void,
    );
  }
}
